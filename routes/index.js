const router = require('express').Router();

router.get('/', (req, res) => {
  throw new Error('error');
  res.render('./index.ejs');
});

module.exports = router;