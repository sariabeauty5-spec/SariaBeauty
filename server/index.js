const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const connectDB = require('./config/db');
const User = require('./models/User');
const PageContent = require('./models/PageContent');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contactRoutes = require('./routes/contactRoutes');
const pageRoutes = require('./routes/pageRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/', (req, res) => {
  res.send('Saria Beauty API is running');
});

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/uploads', require('./routes/uploadRoutes'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const seedAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'Administrator';
    if (email && password) {
      const exists = await User.findOne({ email });
      if (!exists) {
        const admin = await User.create({ name, email, password, isAdmin: true });
        console.log(`Seeded admin: ${admin.email}`);
      }
    }
  } catch (e) {
    console.error('Admin seed failed', e.message);
  }
};
const seedAboutPage = async () => {
  try {
    const exists = await PageContent.findOne({ page: 'about' });
    if (!exists) {
      await PageContent.create({
        page: 'about',
        title: 'About Saria Beauty',
        subtitle: 'Redefining elegance and self-care through a curated collection of premium beauty products.',
        mission: {
          title: 'Our Mission',
          content: 'At Saria Beauty, we believe that beauty is more than just skin deep. It\'s about confidence, elegance, and taking a moment for yourself in a busy world. Our mission is to deliver a luxurious shopping experience with trusted items and seamless service.',
          imageUrl: '/images/Gemini_Generated_Image_6qpale6qpale6qpa.png'
        },
        sections: [
          {
            icon: 'Heart',
            title: 'Passion for Beauty',
            content: 'We believe beauty is an art form and a way to express your unique self.'
          },
          {
            icon: 'Sparkles',
            title: 'Quality First',
            content: 'Every product is carefully selected and tested to meet our high standards.'
          },
          {
            icon: 'ShieldCheck',
            title: 'Trusted Service',
            content: 'Your satisfaction and trust are at the heart of everything we do.'
          }
        ]
      });
      console.log('Seeded About page content');
    }
  } catch (e) {
    console.error('About page seed failed', e.message);
  }
};

seedAdmin();
seedAboutPage();

app.use((err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({ message: err.message || 'Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
