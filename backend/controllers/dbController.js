const { sequelize } = require('../config/database');
const {
  Buyer, Customer, Cutter, Fabricator, Finisher, Printer, Supplier, RawMaterial, Unit,
  PI, PIProduct, PO, POItem, Receipt, ReceiptItem, Cutting, CuttingItem,
  PrinterIssue, PrinterReceive, StitcherIssue, StitcherReceive, Finishing, Shipment
} = require('../models');

// Helpers to compute validations
async function validateDbState(data) {
  let pis = data.pis;
  if (pis === undefined) {
    pis = (await PI.findAll({ include: [{ model: PIProduct, as: 'products' }] })).map(p => p.toJSON());
  }

  let pos = data.pos;
  if (pos === undefined) {
    pos = (await PO.findAll({ include: [{ model: POItem, as: 'items' }] })).map(p => p.toJSON());
  }

  let receipts = data.receipts;
  if (receipts === undefined) {
    receipts = (await Receipt.findAll({ include: [{ model: ReceiptItem, as: 'items' }] })).map(r => r.toJSON());
  }

  let cuttings = data.cuttings;
  if (cuttings === undefined) {
    cuttings = (await Cutting.findAll({ include: [{ model: CuttingItem, as: 'items' }] })).map(c => c.toJSON());
  }

  let printerJobs = data.printerJobs;
  if (printerJobs === undefined) {
    const [issues, receives] = await Promise.all([PrinterIssue.findAll(), PrinterReceive.findAll()]);
    printerJobs = {
      issues: issues.map(i => i.toJSON()),
      receives: receives.map(r => r.toJSON())
    };
  }

  let stitcherJobs = data.stitcherJobs;
  if (stitcherJobs === undefined) {
    const [issues, receives] = await Promise.all([StitcherIssue.findAll(), StitcherReceive.findAll()]);
    stitcherJobs = {
      issues: issues.map(i => i.toJSON()),
      receives: receives.map(r => r.toJSON())
    };
  }

  let finishing = data.finishing;
  if (finishing === undefined) {
    finishing = (await Finishing.findAll()).map(f => f.toJSON());
  }

  let shipments = data.shipments;
  if (shipments === undefined) {
    shipments = (await Shipment.findAll()).map(s => s.toJSON());
  }

  // 1. RM Stock IN Validation: qty received cannot exceed ordered PO quantity (grouped by supplier + material)
  for (let rIdx = 0; rIdx < receipts.length; rIdx++) {
    const rec = receipts[rIdx];
    const recItems = rec.items || [];
    for (let iIdx = 0; iIdx < recItems.length; iIdx++) {
      const item = recItems[iIdx];
      if (!item.name || !item.qty) continue;

      // Find total ordered in POs for this supplier + material
      const orderedQty = pos
        .filter(po => po.supplier === rec.supplier)
        .flatMap(po => (po.items || []).filter(it => it.name === item.name))
        .reduce((sum, it) => sum + Number(it.qty || 0), 0);

      // Find total received in other receipts for this supplier + material
      const alreadyReceived = receipts
        .filter(r => r.id !== rec.id && r.supplier === rec.supplier)
        .flatMap(r => (r.items || []).filter(it => it.name === item.name))
        .reduce((sum, it) => sum + Number(it.qty || 0), 0);

      const available = orderedQty - alreadyReceived;
      if (orderedQty > 0 && Number(item.qty) > available) {
        return `VALIDATION ERROR in RM Stock IN: Received quantity (${item.qty}) for "${item.name}" exceeds available PO balance (${available}) for supplier "${rec.supplier}".`;
      }
    }
  }

  // 2. Cutting Validation: output cutting qty cannot exceed ordered PI qty + 2% allowance
  for (let cIdx = 0; cIdx < cuttings.length; cIdx++) {
    const cut = cuttings[cIdx];
    const cutItems = cut.items || [];
    const selectedPi = pis.find(p => p.piNo === cut.piNo);

    for (let iIdx = 0; iIdx < cutItems.length; iIdx++) {
      const item = cutItems[iIdx];
      if (!item.itemNo) continue;

      if (item.qty && Number(item.qty) > 0) {
        if (selectedPi) {
          const matchingProduct = selectedPi.products.find(p => p.itemNo === item.itemNo);
          if (matchingProduct) {
            const piQty = Number(matchingProduct.qty || 0);
            const limit = piQty * 1.02; // 2% allowance

            // Calculate total already cut for this PI + ItemNo in other cutting lots
            const totalCutOther = cuttings
              .filter(c => c.id !== cut.id && c.piNo === cut.piNo)
              .flatMap(c => (c.items || []).filter(it => it.itemNo === item.itemNo))
              .reduce((sum, it) => sum + Number(it.qty || 0), 0);

            // Plus all rows in the current cutting lot for this itemNo
            const totalCutCurrent = cutItems
              .filter(it => it.itemNo === item.itemNo)
              .reduce((sum, it) => sum + Number(it.qty || 0), 0);

            if (totalCutCurrent + totalCutOther > limit) {
              return `VALIDATION ERROR in Cutting: Total cut quantity (${totalCutCurrent + totalCutOther}) for Item "${item.itemNo}" under PI "${cut.piNo}" exceeds order quantity with 2% allowance limit (${limit} pcs).`;
            }
          }
        }
      }

        // Validate raw material used + rejection doesn't exceed RM Stock IN received quantity
        if (item.rawMaterial) {
          const totalReceived = receipts
            .flatMap(r => r.items || [])
            .filter(it => it.name === item.rawMaterial && it.color === item.rawMaterialColor)
            .reduce((sum, it) => sum + Number(it.qty || 0), 0);

          const totalConsumedOther = cuttings
            .filter(c => c.id !== cut.id)
            .flatMap(c => c.items || [])
            .filter(it => it.rawMaterial === item.rawMaterial && it.rawMaterialColor === item.rawMaterialColor)
            .reduce((sum, it) => sum + Number(it.rawMaterialUsed || 0) + Number(it.rawMaterialRejection || 0), 0);

          const totalConsumedCurrentOther = cutItems
            .slice(0, iIdx)
            .filter(it => it.rawMaterial === item.rawMaterial && it.rawMaterialColor === item.rawMaterialColor)
            .reduce((sum, it) => sum + Number(it.rawMaterialUsed || 0) + Number(it.rawMaterialRejection || 0), 0);

          const totalConsumed = totalConsumedOther + totalConsumedCurrentOther;
          const currentUsage = Number(item.rawMaterialUsed || 0) + Number(item.rawMaterialRejection || 0);
          const availableStock = totalReceived - totalConsumed;

          if (currentUsage > availableStock) {
            return `VALIDATION ERROR in Cutting: Raw material consumption (${currentUsage}) for "${item.rawMaterial}" (${item.rawMaterialColor || 'Natural'}) exceeds available stock received in RM Stock IN (${availableStock}).`;
          }
        }
      }
    }

  // 3. Printer Issue Validation
  const printerIssues = printerJobs.issues || [];
  for (let pIdx = 0; pIdx < printerIssues.length; pIdx++) {
    const issue = printerIssues[pIdx];
    if (!issue.itemNo) continue;

    if (issue.qty && Number(issue.qty) > 0) {
      // Check if printing required is "Yes" in PI
      const selectedPi = pis.find(p => p.piNo === issue.piNo);
      if (selectedPi) {
        const matchingProduct = selectedPi.products.find(pr => pr.itemNo === issue.itemNo);
        if (matchingProduct && matchingProduct.printing !== 'Yes') {
          return `VALIDATION ERROR in Printer Issue: Item "${issue.itemNo}" under PI "${issue.piNo}" does not require printing.`;
        }
      }

      // Check if qty exceeds available cut panels
      const totalCut = cuttings
        .filter(c => c.piNo === issue.piNo)
        .flatMap(c => (c.items || []).filter(it => it.itemNo === issue.itemNo))
        .reduce((sum, it) => sum + Number(it.qty || 0), 0);

      // Sum all printer issues for this itemNo in other records
      const totalIssuedOther = printerIssues
        .filter(i => i.id !== issue.id && i.piNo === issue.piNo && i.itemNo === issue.itemNo)
        .reduce((sum, i) => sum + Number(i.qty || 0), 0);

      if (Number(issue.qty) + totalIssuedOther > totalCut) {
        return `VALIDATION ERROR in Printer Issue: Total qty issued (${Number(issue.qty) + totalIssuedOther}) for Item "${issue.itemNo}" under PI "${issue.piNo}" exceeds available cut panels (${totalCut} pcs).`;
      }
    }
  }

  // 4. Printer Receive Validation
  const printerReceives = printerJobs.receives || [];
  for (let rIdx = 0; rIdx < printerReceives.length; rIdx++) {
    const rec = printerReceives[rIdx];
    if (!rec.itemNo || !rec.qty) continue;

    const totalIssued = printerIssues
      .filter(i => i.printerName === rec.printerName && i.piNo === rec.piNo && i.itemNo === rec.itemNo)
      .reduce((sum, i) => sum + Number(i.qty || 0), 0);

    const totalReceivedOther = printerReceives
      .filter(r => r.id !== rec.id && r.printerName === rec.printerName && r.piNo === rec.piNo && r.itemNo === rec.itemNo)
      .reduce((sum, r) => sum + Number(r.qty || 0), 0);

    const available = totalIssued - totalReceivedOther;
    if (Number(rec.qty) > available) {
      return `VALIDATION ERROR in Printer Receive: Qty received (${rec.qty}) exceeds available print-issued qty (${available} pcs) from printer "${rec.printerName}".`;
    }
  }

  // 5. Stitcher Issue Validation
  const stitcherIssues = stitcherJobs.issues || [];
  for (let sIdx = 0; sIdx < stitcherIssues.length; sIdx++) {
    const issue = stitcherIssues[sIdx];
    if (!issue.itemNo) continue;

    if (issue.qty && Number(issue.qty) > 0) {
      // Check if printing required is "Yes"
      const selectedPi = pis.find(p => p.piNo === issue.piNo);
      const printingRequired = selectedPi && selectedPi.products.some(pr => pr.itemNo === issue.itemNo && pr.printing === 'Yes');

      let totalSource = 0;
      if (printingRequired) {
        // Must come from printer receives
        totalSource = printerReceives
          .filter(r => r.piNo === issue.piNo && r.itemNo === issue.itemNo)
          .reduce((sum, r) => sum + Number(r.qty || 0), 0);
      } else {
        // Must come from cutting directly
        totalSource = cuttings
          .filter(c => c.piNo === issue.piNo)
          .flatMap(c => (c.items || []).filter(it => it.itemNo === issue.itemNo))
          .reduce((sum, it) => sum + Number(it.qty || 0), 0);
      }

      const totalStitchIssuedOther = stitcherIssues
        .filter(i => i.id !== issue.id && i.piNo === issue.piNo && i.itemNo === issue.itemNo)
        .reduce((sum, i) => sum + Number(i.qty || 0), 0);

      if (Number(issue.qty) + totalStitchIssuedOther > totalSource) {
        return `VALIDATION ERROR in Stitcher Issue: Total qty issued (${Number(issue.qty) + totalStitchIssuedOther}) for Item "${issue.itemNo}" under PI "${issue.piNo}" exceeds available stock (${totalSource} pcs) from ${printingRequired ? 'printing receives' : 'cuttings'}.`;
      }
    }
  }

  // 6. Stitcher Receive Validation
  const stitcherReceives = stitcherJobs.receives || [];
  for (let rIdx = 0; rIdx < stitcherReceives.length; rIdx++) {
    const rec = stitcherReceives[rIdx];
    if (!rec.itemNo || !rec.qty) continue;

    const totalIssued = stitcherIssues
      .filter(i => i.fabricatorName === rec.fabricatorName && i.piNo === rec.piNo && i.itemNo === rec.itemNo)
      .reduce((sum, i) => sum + Number(i.qty || 0), 0);

    const totalReceivedOther = stitcherReceives
      .filter(r => r.id !== rec.id && r.fabricatorName === rec.fabricatorName && r.piNo === rec.piNo && r.itemNo === rec.itemNo)
      .reduce((sum, r) => sum + Number(r.qty || 0), 0);

    const available = totalIssued - totalReceivedOther;
    if (Number(rec.qty) > available) {
      return `VALIDATION ERROR in Stitcher Receive: Qty received (${rec.qty}) exceeds stitch-issued qty (${available} pcs) from fabricator "${rec.fabricatorName}".`;
    }
  }

  // 7. Unified Raw Material & Accessories Inventory Stock Check
  const allRMKeys = new Set();
  
  receipts.flatMap(r => r.items || []).forEach(it => {
    if (it.name) allRMKeys.add(JSON.stringify({ name: it.name, color: it.color || '' }));
  });
  cuttings.flatMap(c => c.items || []).forEach(it => {
    if (it.rawMaterial) allRMKeys.add(JSON.stringify({ name: it.rawMaterial, color: it.rawMaterialColor || '' }));
  });
  (printerJobs.issues || []).forEach(it => {
    if (it.accessories) allRMKeys.add(JSON.stringify({ name: it.accessories, color: it.accessoriesColor || '' }));
  });
  (stitcherJobs.issues || []).forEach(it => {
    if (it.accessories) allRMKeys.add(JSON.stringify({ name: it.accessories, color: it.accessoriesColor || '' }));
  });

  for (const keyStr of allRMKeys) {
    const { name, color } = JSON.parse(keyStr);
    
    const received = receipts
      .flatMap(r => r.items || [])
      .filter(it => it.name === name && (it.color || '') === color)
      .reduce((sum, it) => sum + Number(it.qty || 0), 0);

    const cutConsumed = cuttings
      .flatMap(c => c.items || [])
      .filter(it => it.rawMaterial === name && (it.rawMaterialColor || '') === color)
      .reduce((sum, it) => sum + Number(it.rawMaterialUsed || 0) + Number(it.rawMaterialRejection || 0), 0);

    const printIssued = (printerJobs.issues || [])
      .filter(it => it.accessories === name && (it.accessoriesColor || '') === color)
      .reduce((sum, it) => sum + Number(it.accessoriesQty || 0), 0);

    const stitchIssued = (stitcherJobs.issues || [])
      .filter(it => it.accessories === name && (it.accessoriesColor || '') === color)
      .reduce((sum, it) => sum + Number(it.accessoriesQty || 0), 0);

    const totalUsed = cutConsumed + printIssued + stitchIssued;
    if (totalUsed > received) {
      return `VALIDATION ERROR: Total raw material & accessories issue/consumption (${totalUsed}) for "${name}" (${color || 'Natural'}) exceeds total stock received in RM Stock IN (${received}). (Consumed in Cutting: ${cutConsumed}, Issued in Printing: ${printIssued}, Issued in Stitching: ${stitchIssued})`;
    }
  }

  // 8. Shipment Validation: Shipped quantity cannot exceed Finished Quantity
  for (let sIdx = 0; sIdx < shipments.length; sIdx++) {
    const ship = shipments[sIdx];
    if (!ship.itemNo || !ship.qty) continue;

    const totalFinished = finishing
      .filter(f => f.piNo === ship.piNo && f.itemNo === ship.itemNo)
      .reduce((sum, f) => sum + Number(f.qty || 0), 0);

    const totalShipped = shipments
      .filter(s => s.piNo === ship.piNo && s.itemNo === ship.itemNo)
      .reduce((sum, s) => sum + Number(s.qty || 0), 0);

    if (totalShipped > totalFinished) {
      return `VALIDATION ERROR in Shipment: Total shipped quantity (${totalShipped} pcs) for Item "${ship.itemNo}" under PI "${ship.piNo}" exceeds total finished stock (${totalFinished} pcs).`;
    }
  }

  return null;
}

exports.getDbState = async (req, res) => {
  try {
    const [
      pis, pos, receipts, cuttings, printerIssues, printerReceives,
      stitcherIssues, stitcherReceives, finishing, shipments
    ] = await Promise.all([
      PI.findAll({ include: [{ model: PIProduct, as: 'products' }] }),
      PO.findAll({ include: [{ model: POItem, as: 'items' }] }),
      Receipt.findAll({ include: [{ model: ReceiptItem, as: 'items' }] }),
      Cutting.findAll({ include: [{ model: CuttingItem, as: 'items' }] }),
      PrinterIssue.findAll(),
      PrinterReceive.findAll(),
      StitcherIssue.findAll(),
      StitcherReceive.findAll(),
      Finishing.findAll(),
      Shipment.findAll()
    ]);

    // Format identical to frontend defaultDb / mockDb structure
    const dbState = {
      pis: pis.map(p => p.toJSON()),
      pos: pos.map(p => p.toJSON()),
      receipts: receipts.map(r => r.toJSON()),
      cuttings: cuttings.map(c => c.toJSON()),
      printerJobs: {
        issues: printerIssues.map(i => i.toJSON()),
        receives: printerReceives.map(r => r.toJSON())
      },
      stitcherJobs: {
        issues: stitcherIssues.map(i => i.toJSON()),
        receives: stitcherReceives.map(r => r.toJSON())
      },
      finishing: finishing.map(f => f.toJSON()),
      shipments: shipments.map(s => s.toJSON())
    };

    res.json(dbState);
  } catch (err) {
    console.error('getDbState error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.saveDbState = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const data = req.body;

    // Run backend validations first
    const validationError = await validateDbState(data);
    if (validationError) {
      await transaction.rollback();
      return res.status(400).json({ error: validationError });
    }

    const {
      pis, pos, receipts, cuttings,
      printerJobs, stitcherJobs, finishing, shipments
    } = data;

    // 1. Sync PIs and PIProducts
    if (pis !== undefined) {
      const incomingPiIds = pis.map(p => p.id);
      await PI.destroy({ where: { id: { [sequelize.Sequelize.Op.notIn]: incomingPiIds } }, transaction });
      for (const p of pis) {
        await PI.upsert({ id: p.id, date: p.date, piNo: p.piNo }, { transaction });
        await PIProduct.destroy({ where: { piId: p.id }, transaction });
        if (p.products && p.products.length > 0) {
          const productsToInsert = p.products.map(pr => ({
            piId: p.id,
            itemNo: pr.itemNo,
            description: pr.description,
            buyerName: pr.buyerName,
            qty: pr.qty,
            deliveryDate: pr.deliveryDate,
            printing: pr.printing
          }));
          await PIProduct.bulkCreate(productsToInsert, { transaction });
        }
      }
    }

    // 2. Sync POs and POItems
    if (pos !== undefined) {
      const incomingPoIds = pos.map(p => p.id);
      await PO.destroy({ where: { id: { [sequelize.Sequelize.Op.notIn]: incomingPoIds } }, transaction });
      for (const p of pos) {
        await PO.upsert({ id: p.id, date: p.date, supplier: p.supplier, poNo: p.poNo }, { transaction });
        await POItem.destroy({ where: { poId: p.id }, transaction });
        if (p.items && p.items.length > 0) {
          const itemsToInsert = p.items.map(it => ({
            poId: p.id,
            name: it.name,
            color: it.color,
            qty: it.qty,
            unit: it.unit,
            rate: it.rate
          }));
          await POItem.bulkCreate(itemsToInsert, { transaction });
        }
      }
    }

    // 3. Sync Receipts and ReceiptItems
    if (receipts !== undefined) {
      const incomingReceiptIds = receipts.map(r => r.id);
      await Receipt.destroy({ where: { id: { [sequelize.Sequelize.Op.notIn]: incomingReceiptIds } }, transaction });
      for (const r of receipts) {
        await Receipt.upsert({ id: r.id, date: r.date, supplier: r.supplier }, { transaction });
        await ReceiptItem.destroy({ where: { receiptId: r.id }, transaction });
        if (r.items && r.items.length > 0) {
          const itemsToInsert = r.items.map(it => ({
            receiptId: r.id,
            name: it.name,
            color: it.color,
            qty: it.qty,
            unit: it.unit
          }));
          await ReceiptItem.bulkCreate(itemsToInsert, { transaction });
        }
      }
    }

    // 4. Sync Cuttings and CuttingItems
    if (cuttings !== undefined) {
      const incomingCuttingIds = cuttings.map(c => c.id);
      await Cutting.destroy({ where: { id: { [sequelize.Sequelize.Op.notIn]: incomingCuttingIds } }, transaction });
      for (const c of cuttings) {
        await Cutting.upsert({ id: c.id, date: c.date, piNo: c.piNo }, { transaction });
        await CuttingItem.destroy({ where: { cuttingId: c.id }, transaction });
        if (c.items && c.items.length > 0) {
          const itemsToInsert = c.items.map(it => ({
            cuttingId: c.id,
            cutterName: it.cutterName,
            itemNo: it.itemNo,
            qty: it.qty,
            rawMaterial: it.rawMaterial,
            rawMaterialColor: it.rawMaterialColor,
            rawMaterialUsed: it.rawMaterialUsed,
            rawMaterialRejection: it.rawMaterialRejection,
            billRec: it.billRec,
            billNo: it.billNo,
            billDate: it.billDate,
            billFile: it.billFile,
            remarks: it.remarks
          }));
          await CuttingItem.bulkCreate(itemsToInsert, { transaction });
        }
      }
    }

    // 5. Sync Printer Issues
    if (printerJobs !== undefined) {
      const printerIssues = printerJobs.issues || [];
      const incomingPrintIssueIds = printerIssues.map(i => i.id);
      await PrinterIssue.destroy({ where: { id: { [sequelize.Sequelize.Op.notIn]: incomingPrintIssueIds } }, transaction });
      for (const i of printerIssues) {
        await PrinterIssue.upsert({
          id: i.id,
          date: i.date,
          printerName: i.printerName,
          piNo: i.piNo,
          itemNo: i.itemNo,
          qty: i.qty,
          accessories: i.accessories,
          accessoriesQty: i.accessoriesQty,
          accessoriesColor: i.accessoriesColor,
          remarks: i.remarks
        }, { transaction });
      }

      // 6. Sync Printer Receives
      const printerReceives = printerJobs.receives || [];
      const incomingPrintRecIds = printerReceives.map(r => r.id);
      await PrinterReceive.destroy({ where: { id: { [sequelize.Sequelize.Op.notIn]: incomingPrintRecIds } }, transaction });
      for (const r of printerReceives) {
        await PrinterReceive.upsert({
          id: r.id,
          date: r.date,
          printerName: r.printerName,
          piNo: r.piNo,
          itemNo: r.itemNo,
          qty: r.qty,
          rejectionFabricator: r.rejectionFabricator,
          rejectionFactory: r.rejectionFactory,
          rejectionRemarks: r.rejectionRemarks,
          billRec: r.billRec,
          billNo: r.billNo,
          billDate: r.billDate,
          billFile: r.billFile,
          qcCheckedBy: r.qcCheckedBy,
          remarks: r.remarks
        }, { transaction });
      }
    }

    // 7. Sync Stitcher Issues
    if (stitcherJobs !== undefined) {
      const stitcherIssues = stitcherJobs.issues || [];
      const incomingStitchIssueIds = stitcherIssues.map(i => i.id);
      await StitcherIssue.destroy({ where: { id: { [sequelize.Sequelize.Op.notIn]: incomingStitchIssueIds } }, transaction });
      for (const i of stitcherIssues) {
        await StitcherIssue.upsert({
          id: i.id,
          date: i.date,
          fabricatorName: i.fabricatorName,
          piNo: i.piNo,
          itemNo: i.itemNo,
          qty: i.qty,
          accessories: i.accessories,
          accessoriesQty: i.accessoriesQty,
          accessoriesColor: i.accessoriesColor,
          remarks: i.remarks
        }, { transaction });
      }

      // 8. Sync Stitcher Receives
      const stitcherReceives = stitcherJobs.receives || [];
      const incomingStitchRecIds = stitcherReceives.map(r => r.id);
      await StitcherReceive.destroy({ where: { id: { [sequelize.Sequelize.Op.notIn]: incomingStitchRecIds } }, transaction });
      for (const r of stitcherReceives) {
        await StitcherReceive.upsert({
          id: r.id,
          date: r.date,
          fabricatorName: r.fabricatorName,
          piNo: r.piNo,
          itemNo: r.itemNo,
          qty: r.qty,
          rejectionFabricator: r.rejectionFabricator,
          rejectionFactory: r.rejectionFactory,
          rejectionRemarks: r.rejectionRemarks,
          billRec: r.billRec,
          billNo: r.billNo,
          billDate: r.billDate,
          billFile: r.billFile,
          qcCheckedBy: r.qcCheckedBy,
          remarks: r.remarks
        }, { transaction });
      }
    }

    // 9. Sync Finishing
    if (finishing !== undefined) {
      const incomingFinishingIds = finishing.map(f => f.id);
      await Finishing.destroy({ where: { id: { [sequelize.Sequelize.Op.notIn]: incomingFinishingIds } }, transaction });
      for (const f of finishing) {
        await Finishing.upsert({
          id: f.id,
          date: f.date,
          jobworkerName: f.jobworkerName,
          piNo: f.piNo,
          itemNo: f.itemNo,
          qty: f.qty,
          rejection: f.rejection,
          ctnDims: f.ctnDims,
          netWt: f.netWt,
          grossWt: f.grossWt,
          pcsPerCtn: f.pcsPerCtn,
          volumeCbm: f.volumeCbm,
          billRec: f.billRec,
          billNo: f.billNo,
          billDate: f.billDate,
          billFile: f.billFile,
          qcCheckedBy: f.qcCheckedBy,
          remarks: f.remarks
        }, { transaction });
      }
    }

    // 10. Sync Shipments
    if (shipments !== undefined) {
      const incomingShipmentIds = shipments.map(s => s.id);
      await Shipment.destroy({ where: { id: { [sequelize.Sequelize.Op.notIn]: incomingShipmentIds } }, transaction });
      for (const s of shipments) {
        await Shipment.upsert({
          id: s.id,
          date: s.date,
          invNo: s.invNo,
          party: s.party,
          piNo: s.piNo,
          itemNo: s.itemNo,
          qty: s.qty
        }, { transaction });
      }
    }

    await transaction.commit();
    res.json({ success: true });
  } catch (err) {
    await transaction.rollback();
    console.error('saveDbState error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getTableData = async (req, res) => {
  const { table } = req.params;
  try {
    let data;
    switch (table) {
      case 'pis':
        data = await PI.findAll({ include: [{ model: PIProduct, as: 'products' }] });
        break;
      case 'pos':
        data = await PO.findAll({ include: [{ model: POItem, as: 'items' }] });
        break;
      case 'receipts':
        data = await Receipt.findAll({ include: [{ model: ReceiptItem, as: 'items' }] });
        break;
      case 'cuttings':
        data = await Cutting.findAll({ include: [{ model: CuttingItem, as: 'items' }] });
        break;
      case 'printerJobs':
        const [pIssues, pReceives] = await Promise.all([PrinterIssue.findAll(), PrinterReceive.findAll()]);
        data = { issues: pIssues, receives: pReceives };
        break;
      case 'stitcherJobs':
        const [sIssues, sReceives] = await Promise.all([StitcherIssue.findAll(), StitcherReceive.findAll()]);
        data = { issues: sIssues, receives: sReceives };
        break;
      case 'finishing':
        data = await Finishing.findAll();
        break;
      case 'shipments':
        data = await Shipment.findAll();
        break;
      default:
        return res.status(400).json({ error: 'Invalid table name' });
    }
    res.json(data);
  } catch (err) {
    console.error('getTableData error:', err);
    res.status(500).json({ error: err.message });
  }
};
