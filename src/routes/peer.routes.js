import { Router } from 'express';
import { PeerController } from '../controllers/peer.controller.js';
import { authenticate, requireRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// All peer routes require ARTISAN role authentication
router.use(authenticate, requireRoles('ARTISAN'));

router.get('/directory', PeerController.getPeerDirectory);
router.post('/subcontracts', PeerController.createSubcontract);
router.get('/subcontracts', PeerController.getMySubcontracts);
router.patch('/subcontracts/:id/status', PeerController.updateSubcontractStatus);

export default router;
