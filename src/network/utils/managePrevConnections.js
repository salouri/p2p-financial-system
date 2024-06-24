// network/utils/managePeerConnections.js
import state from '../../common/state/index.js';
export async function loadPrevConnections(db = state?.db) {
  try {
    const connectionsEntry = await db.get('previous-connections');
    const peerConnections = connectionsEntry?.value;
    await db.del('previous-peer-connections'); // Reset the value after reading it
    return peerConnections || [];
  } catch (error) {
    console.error('Error loading peer connections from database:', error);
    return [];
  }
}

export async function savePeerConnections(db = state?.db, peers) {
  try {
    await db.put('previous-connections', JSON.stringify(peers));
  } catch (error) {
    console.error('Error saving peer connections to database:', error);
  }
}
