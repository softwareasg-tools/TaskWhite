const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

let marked = null;
(async () => {
  try {
    const m = await import('marked');
    marked = m.marked || m.default;
  } catch (err) {
    console.error("Failed to load marked:", err);
  }
})();

// Helper to render markdown files
const renderContentPage = (res, folder, filename, req) => {
  const filePath = path.join(__dirname, '..', 'content_strategy', folder, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).render('pages/404', { 
      user: req.user,
      title: 'Page Not Found',
      error: 'The requested content could not be found.'
    });
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(fileContent);
  const htmlContent = marked ? marked(parsed.content) : parsed.content;
  
  const seoTitle = parsed.data.title || 'TaskWhite';
  const seoDescription = parsed.data.description || 'TaskWhite Productivity Software';
  
  res.render('pages/content', {
    user: req.user,
    title: seoTitle,
    description: seoDescription,
    htmlContent: htmlContent,
    frontmatter: parsed.data
  });
};

// Routes
router.get('/compare/:competitor', (req, res) => {
  const competitor = req.params.competitor.toLowerCase().replace(/[^a-z0-9\-]/g, '');
  renderContentPage(res, 'competitor_comparisons', `taskwhite-vs-${competitor}.md`, req);
});

router.get('/industry/:industry', (req, res) => {
  const industry = req.params.industry.toLowerCase().replace(/[^a-z0-9\_]/g, '');
  renderContentPage(res, 'industry_pages', `${industry}.md`, req);
});

router.get('/role/:role', (req, res) => {
  const role = req.params.role.toLowerCase().replace(/[^a-z0-9\-]/g, '');
  renderContentPage(res, 'role_pages', `${role}.md`, req);
});

router.get('/features/:feature', (req, res) => {
  const feature = req.params.feature.toLowerCase().replace(/[^a-z0-9\-]/g, '');
  renderContentPage(res, 'feature_pages', `${feature}.md`, req);
});

router.get('/help/:topic', (req, res) => {
  const topic = req.params.topic.toLowerCase().replace(/[^a-z0-9\-]/g, '');
  if (topic === 'billing') {
    return res.redirect('/');
  }
  renderContentPage(res, 'help_center', `${topic}.md`, req);
});

module.exports = router;
