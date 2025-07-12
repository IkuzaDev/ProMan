const Landing = require('../models/Landing');

const getHomePage = async (req, res) => {
  try {
    const heroContent = await Landing.getHeroSection();
    const features = await Landing.getFeatures();
    const ctaContent = await Landing.getCtaSection();
    
    res.render('index', {
      title: 'ProMan - Project Management System',
      hero: heroContent,
      features: features,
      cta: ctaContent
    });
  } catch (err) {
    console.error('Error loading landing page:', err);
    res.render('index', {
      title: 'ProMan - Project Management System',
      error: 'Terjadi kesalahan saat memuat konten'
    });
  }
};

const getAdminLandingContent = async (req, res) => {
  try {
    const content = await Landing.getAllContent();
    
    res.render('admin/landing-content', {
      title: 'Kelola Landing Page - ProMan',
      content: content,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error getting landing content:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memuat konten' });
    res.redirect('/admin/dashboard');
  }
};

const getEditContent = async (req, res) => {
  try {
    const contentId = req.params.id;
    const content = await Landing.getContentById(contentId);
    
    if (!content) {
      req.flash('message', { type: 'error', text: 'Konten tidak ditemukan' });
      return res.redirect('/admin/landing');
    }
    
    res.render('admin/edit-landing-content', {
      title: 'Edit Landing Page Content - ProMan',
      content: content,
      message: req.flash('message')[0] || null
    });
  } catch (err) {
    console.error('Error getting content for edit:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan' });
    res.redirect('/admin/landing');
  }
};

const updateContent = async (req, res) => {
  try {
    const contentId = req.params.id;
    const { title, content, button_text, button_link } = req.body;
    console.log('Updating content with ID:', contentId);
    console.log('File upload:', content);
    
    let imagePath = null;
    if (req.file) {
      imagePath = `/images/${req.file.filename}`;
    }
    
    console.log('Updating content with ID:', contentId);
    console.log('File upload:', req.file ? req.file.filename : 'No file uploaded');
    
    await Landing.updateContent(contentId, {
      title,
      content,
      image: imagePath || req.body.current_image,
      button_text,
      button_link,
      updated_by: req.session.user.id
    });
    
    req.flash('message', { type: 'success', text: 'Konten berhasil diperbarui' });
    res.redirect('/admin/landing');
  } catch (err) {
    console.error('Error updating landing content:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat memperbarui konten' });
    res.redirect(`/admin/landing/edit/${req.params.id}`);
  }
};

const getAddContent = (req, res) => {
  res.render('admin/add-landing-content', {
    title: 'Tambah Landing Page Content - ProMan',
    message: req.flash('message')[0] || null
  });
};

const createContent = async (req, res) => {
  try {
    const { section, title, content, button_text, button_link, order_num } = req.body;
    console.log('Creating new content:', section, title, content, button_text, button_link, order_num);

    let imagePath = null;
    if (req.file) {
      imagePath = `/images/${req.file.filename}`;
    }
    
    await Landing.createContent({
      section,
      title,
      content,
      image: imagePath,
      button_text,
      button_link,
      order_num: parseInt(order_num, 10) || 999,
      updated_by: req.session.user.id
    });
    
    req.flash('message', { type: 'success', text: 'Konten baru berhasil ditambahkan' });
    res.redirect('/admin/landing');
  } catch (err) {
    console.error('Error creating landing content:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat menambahkan konten' });
    res.redirect('/admin/landing/add');
  }
};

const deleteContent = async (req, res) => {
  try {
    const contentId = req.params.id;
    await Landing.deleteContent(contentId);
    
    req.flash('message', { type: 'success', text: 'Konten berhasil dihapus' });
    res.redirect('/admin/landing');
  } catch (err) {
    console.error('Error deleting landing content:', err);
    req.flash('message', { type: 'error', text: 'Terjadi kesalahan saat menghapus konten' });
    res.redirect('/admin/landing');
  }
};

const updateContentOrder = async (req, res) => {
  try {
    const { contentOrder } = req.body;
    
    for (const item of contentOrder) {
      await Landing.updateOrder(
        item.id, 
        item.order, 
        req.session.user.id
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating content order:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
  }
};

module.exports = {
  getHomePage,
  getAdminLandingContent,
  getEditContent,
  updateContent,
  getAddContent,
  createContent,
  deleteContent,
  updateContentOrder
};
