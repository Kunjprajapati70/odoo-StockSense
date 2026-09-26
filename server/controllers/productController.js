import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  productOptions,
  updateProduct,
} from '../services/productService.js';

export const index = asyncHandler(async (req, res) => {
  const { items, meta } = await listProducts(req.query);
  res.json({ success: true, data: items, meta });
});

export const options = asyncHandler(async (req, res) => {
  const data = await productOptions();
  res.json({ success: true, data });
});

export const show = asyncHandler(async (req, res) => {
  const data = await getProduct(req.params.id);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await createProduct(req.body, req.user);
  res.status(201).json({ success: true, message: 'Product created successfully.', data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await updateProduct(req.params.id, req.body);
  res.json({ success: true, message: 'Product updated successfully.', data });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteProduct(req.params.id);
  res.json({ success: true, message: 'Product deleted successfully.' });
});
