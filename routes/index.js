var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Home' });
});

router.get('/shows', function(req, res) {
  res.render('shows', {title: 'Shows'});
});

router.get('/auditions', function(req, res) {
  res.render('auditions', {title: 'Auditions'});
});

router.get('/cast-crew', function(req, res) {
  res.render('cast-crew', {title: 'Cast & Crew'});
});

router.get('/faq', function(req, res) {
  res.render('faq', {title: 'FAQ'});
});

router.get('/media', function(req, res) {
  res.render('media', {title: 'Media'});
});

router.get('/tickets', function(req, res) {
  res.render('tickets', {title: 'Tickets'});
});

router.get('/admin', function(req, res) {
  res.render('admin');
});

router.get('/test', function(req, res) {
  res.send("Site is up and running, sir!");
});

module.exports = router;
