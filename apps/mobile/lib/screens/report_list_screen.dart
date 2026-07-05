import 'package:flutter/material.dart';

import '../models/report.dart';
import '../services/data_service.dart';
import '../theme.dart';

class ReportListScreen extends StatefulWidget {
  const ReportListScreen({super.key});

  @override
  State<ReportListScreen> createState() => _ReportListScreenState();
}

class _ReportListScreenState extends State<ReportListScreen> {
  final _data = DataService();
  late Future<List<Report>> _future;

  @override
  void initState() {
    super.initState();
    _future = _data.getReports();
  }

  Future<void> _refresh() async {
    final reports = _data.getReports();
    setState(() => _future = reports);
    await reports;
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<List<Report>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return _ErrorState(message: snapshot.error.toString());
          }
          final reports = snapshot.data ?? [];
          if (reports.isEmpty) {
            return ListView(
              children: const [
                SizedBox(height: 120),
                Center(child: Text('No reports yet.')),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            itemCount: reports.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) => _ReportTile(
              report: reports[i],
              onSupport: () async {
                final ok = await _data.support(reports[i].id);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(ok ? 'Supported' : 'Already supported'),
                    ),
                  );
                }
                _refresh();
              },
            ),
          );
        },
      ),
    );
  }
}

class _ReportTile extends StatelessWidget {
  final Report report;
  final VoidCallback onSupport;

  const _ReportTile({required this.report, required this.onSupport});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: Color(0xFFE2E8F0)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: categoryColor(report.category),
                borderRadius: BorderRadius.circular(10),
                image: report.imageUrl != null
                    ? DecorationImage(
                        image: NetworkImage(report.imageUrl!),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(report.title,
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 2),
                  Text(
                    '${report.category} · ${report.priority} · ${report.status}',
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      OutlinedButton.icon(
                        onPressed: onSupport,
                        icon: const Icon(Icons.thumb_up_alt_outlined, size: 16),
                        label: Text('Support (${report.supportCount})'),
                        style: OutlinedButton.styleFrom(
                          visualDensity: VisualDensity.compact,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  const _ErrorState({required this.message});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        const SizedBox(height: 100),
        const Icon(Icons.error_outline, color: Colors.red, size: 40),
        const SizedBox(height: 8),
        Center(child: Text('Could not load reports.\n$message',
            textAlign: TextAlign.center)),
      ],
    );
  }
}
