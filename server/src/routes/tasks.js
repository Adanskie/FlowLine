const router = require('express').Router();
const c = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

// Read — all authenticated roles
router.get('/',    c.index);
router.get('/:id', c.show);

// Create / Edit — Manager + Admin
router.post('/',   authorize('Administrator','Manager'), upload.array('attachments', 10), c.store);
router.put('/:id', authorize('Administrator','Manager'), c.update);
router.delete('/:id', authorize('Administrator','Manager'), c.destroy);

// Stage / Approval / Actions
router.post('/:id/change-stage',  authorize('Administrator','Manager'), c.changeStage);
router.post('/:id/approve',       authorize('Administrator','Manager'), c.approve);
router.post('/:id/submit-review', authorize('Employee'), c.submitForReview);
router.post('/:id/progress',      authorize('Employee'), c.postProgress);
router.post('/:id/comment',       c.addComment);
router.delete('/:id/comments/:cid', authorize('Administrator','Manager'), c.deleteComment);
router.post('/:id/attachments',   upload.single('file'), c.uploadAttachment);

module.exports = router;
