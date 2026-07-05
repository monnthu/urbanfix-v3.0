import Link from 'next/link';
import { PRIORITY_STYLES, STATUS_STYLES, STATUS_LABELS, categoryColor } from '@/lib/constants';
import type { Report } from '@/lib/types';

export function ReportCard({ report }: { report: Report }) {
  return (
    <Link href={`/reports/${report.id}`} className="card block p-4 transition hover:shadow-md">
      <div className="flex gap-4">
        {report.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={report.image_url}
            alt=""
            className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div
            className="grid h-20 w-20 flex-shrink-0 place-items-center rounded-lg text-white"
            style={{ backgroundColor: categoryColor(report.category) }}
          >
            <span className="text-xs capitalize">{report.category}</span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{report.title}</h3>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {report.description || 'No description'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`badge ${STATUS_STYLES[report.status]}`}>
              {STATUS_LABELS[report.status]}
            </span>
            <span className={`badge ${PRIORITY_STYLES[report.priority]}`}>
              {report.priority}
            </span>
            <span className="text-xs text-slate-400">
              {report.support_count} support
              {report.support_count === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
