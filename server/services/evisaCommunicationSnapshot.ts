export type EvisaCommunicationSnapshotItem = {
  destinationId: string;
  country: string;
  officialPortalUrl: string;
  officialPortalLabel: string;
  officialVerifiedAt: string;
  requirements: string;
  fee: string;
  delay: string;
  procedureUrl: string;
};

export function createEvisaCommunicationSnapshot(items: EvisaCommunicationSnapshotItem[], messageContentAtSend: string, adminId: number, sharedAt = new Date()) {
  return JSON.stringify({ version: 1, sharedAt: sharedAt.toISOString(), sharedByAdminId: adminId, messageContentAtSend, items });
}
