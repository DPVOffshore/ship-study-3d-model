import DiagramSheet from '@/components/diagrams/DiagramSheet';
import { DIAGRAM_BY_ID, DIAGRAMS } from '@/lib/diagrams';
import type { DiagramId } from '@/lib/kb';

export const dynamicParams = false;
export function generateStaticParams() { return DIAGRAMS.map((d) => ({ id: d.id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: DIAGRAM_BY_ID[id as DiagramId]?.title ?? 'Flow diagram' };
}
export default async function DiagramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DiagramSheet id={id as DiagramId} />;
}
