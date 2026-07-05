import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../models/report.dart';
import '../services/data_service.dart';
import '../theme.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  final _data = DataService();
  final _controller = WebViewController()
    ..setJavaScriptMode(JavaScriptMode.unrestricted);
  bool _loading = true;
  List<Category> _categories = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final reports = await _data.getReports();
      _categories = await _data.getCategories();
      await _controller.loadHtmlString(_buildHtml(reports));
    } catch (_) {
      await _controller.loadHtmlString(_buildHtml([]));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _colorHex(String category) {
    final c = categoryColor(category);
    return '#${(c.value & 0xFFFFFF).toRadixString(16).padLeft(6, '0')}';
  }

  String _buildHtml(List<Report> reports) {
    final markers = reports
        .map((r) => {
              'lat': r.latitude,
              'lng': r.longitude,
              'title': r.title,
              'color': _colorHex(r.category),
              'meta': '${r.category} · ${r.priority} · ${r.status}',
            })
        .toList();
    final data = jsonEncode(markers);
    final center = reports.isNotEmpty
        ? '[${reports.first.latitude}, ${reports.first.longitude}]'
        : '[40.7328, -73.9911]';

    return '''
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>html,body,#map{height:100%;margin:0}</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView($center, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    const markers = $data;
    markers.forEach(function(m) {
      L.circleMarker([m.lat, m.lng], {
        radius: 8, color: '#fff', weight: 2,
        fillColor: m.color, fillOpacity: 0.9
      }).addTo(map).bindPopup('<b>' + m.title + '</b><br>' + m.meta);
    });
  </script>
</body>
</html>
''';
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        WebViewWidget(controller: _controller),
        if (_loading) const Center(child: CircularProgressIndicator()),
        Positioned(
          left: 12,
          bottom: 12,
          child: _Legend(categories: _categories),
        ),
      ],
    );
  }
}

class _Legend extends StatelessWidget {
  final List<Category> categories;
  const _Legend({required this.categories});

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.92),
        borderRadius: BorderRadius.circular(10),
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 6)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('Legend',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          const SizedBox(height: 6),
          ...categories.map((c) => Padding(
                padding: const EdgeInsets.only(bottom: 3),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: categoryColor(c.id),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(c.label, style: const TextStyle(fontSize: 11)),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}
