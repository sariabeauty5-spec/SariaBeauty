const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { broadcastEvent } = require('../utils/sse');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  } else {
    const order = new Order({
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();
    // decrement stock
    for (const item of createdOrder.orderItems) {
      try {
        const p = await Product.findById(item.product);
        if (p) {
          p.countInStock = Math.max(0, (p.countInStock || 0) - item.qty);
          await p.save();
          broadcastEvent({ channel: 'product', type: 'product_updated', product: p });
        }
      } catch {}
    }
    broadcastEvent({ channel: 'order', type: 'order_created', order: createdOrder });
    res.status(201).json(createdOrder);
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(404);
    throw new Error('Order not found');
  }
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});

// @desc    Get all orders (admin)
// @route   GET /api/orders/all
// @access  Private/Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Update order status (paid/delivered)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (typeof req.body.isPaid === 'boolean') {
    order.isPaid = req.body.isPaid;
    order.paidAt = req.body.isPaid ? new Date() : undefined;
  }
  if (typeof req.body.isDelivered === 'boolean') {
    order.isDelivered = req.body.isDelivered;
    order.deliveredAt = req.body.isDelivered ? new Date() : undefined;
  }
  const saved = await order.save();
  broadcastEvent({ channel: 'order', type: 'order_updated', order: saved });
  res.json(saved);
});

module.exports = { createOrder, getOrderById, getMyOrders, getAllOrders, updateOrderStatus };
