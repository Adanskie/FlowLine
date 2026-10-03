const router = require('express').Router();
const c = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/',    authorize('Administrator'), c.index);
router.post('/',   authorize('Administrator'), upload.single('profile_photo'), c.store);
router.get('/:id', authorize('Administrator'), c.show);
router.put('/:id', authorize('Administrator'), upload.single('profile_photo'), c.update);
router.delete('/:id', authorize('Administrator'), c.destroy);

module.exports = router;
