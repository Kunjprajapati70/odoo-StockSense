import { asyncHandler } from '../utils/asyncHandler.js';
import * as operations from '../services/operationService.js';
import { getDashboard } from '../services/dashboardService.js';

function handler(action, message, status = 200) {
  return asyncHandler(async (req, res) => {
    const result = await action(req);
    if (result && Array.isArray(result.items) && result.meta) {
      res.status(status).json({ success: true, data: result.items, meta: result.meta });
      return;
    }
    const body = { success: true, data: result };
    if (message) body.message = message;
    res.status(status).json(body);
  });
}

export const receipts = {
  index: handler((req) => operations.listReceipts(req.query)),
  show: handler((req) => operations.getReceipt(req.params.id)),
  create: handler((req) => operations.createReceipt(req.body, req.user), 'Receipt created successfully.', 201),
  update: handler((req) => operations.updateReceipt(req.params.id, req.body, req.user), 'Receipt updated successfully.'),
  validate: handler((req) => operations.validateReceipt(req.params.id, req.user), 'Receipt validated. Stock increased.'),
  cancel: handler((req) => operations.cancelReceipt(req.params.id), 'Receipt canceled.'),
};

export const deliveries = {
  index: handler((req) => operations.listDeliveries(req.query)),
  show: handler((req) => operations.getDelivery(req.params.id)),
  create: handler((req) => operations.createDelivery(req.body, req.user), 'Delivery created successfully.', 201),
  update: handler((req) => operations.updateDelivery(req.params.id, req.body), 'Delivery updated successfully.'),
  validate: handler((req) => operations.validateDelivery(req.params.id, req.user), 'Delivery completed. Stock decreased.'),
  cancel: handler((req) => operations.cancelDelivery(req.params.id), 'Delivery canceled.'),
};

export const transfers = {
  index: handler((req) => operations.listTransfers(req.query)),
  show: handler((req) => operations.getTransfer(req.params.id)),
  create: handler((req) => operations.createTransfer(req.body, req.user), 'Transfer created successfully.', 201),
  update: handler((req) => operations.updateTransfer(req.params.id, req.body), 'Transfer updated successfully.'),
  validate: handler((req) => operations.validateTransfer(req.params.id, req.user), 'Transfer completed. Location stock updated.'),
  cancel: handler((req) => operations.cancelTransfer(req.params.id), 'Transfer canceled.'),
};

export const adjustments = {
  index: handler((req) => operations.listAdjustments(req.query)),
  show: handler((req) => operations.getAdjustment(req.params.id)),
  create: handler((req) => operations.createAdjustment(req.body, req.user), 'Adjustment created successfully.', 201),
  update: handler((req) => operations.updateAdjustment(req.params.id, req.body), 'Adjustment updated successfully.'),
  validate: handler((req) => operations.validateAdjustment(req.params.id, req.user), 'Stock adjusted.'),
  cancel: handler((req) => operations.cancelAdjustment(req.params.id), 'Adjustment canceled.'),
};

export const dashboard = asyncHandler(async (req, res) => {
  const data = await getDashboard(req.query);
  res.json({ success: true, data });
});
