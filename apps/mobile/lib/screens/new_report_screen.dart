import 'dart:io';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';

import '../models/report.dart';
import '../services/data_service.dart';

class NewReportScreen extends StatefulWidget {
  const NewReportScreen({super.key});

  @override
  State<NewReportScreen> createState() => _NewReportScreenState();
}

class _NewReportScreenState extends State<NewReportScreen> {
  final _data = DataService();
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _address = TextEditingController();

  List<Category> _categories = [];
  String? _category;
  File? _photo;
  double? _lat;
  double? _lng;
  bool _busy = false;
  String? _message;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    try {
      final cats = await _data.getCategories();
      setState(() {
        _categories = cats;
        _category = cats.isNotEmpty ? cats.first.id : 'other';
      });
    } catch (_) {}
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final img = await picker.pickImage(source: ImageSource.gallery);
    if (img != null) setState(() => _photo = File(img.path));
  }

  Future<void> _useLocation() async {
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        setState(() => _message = 'Location permission denied.');
        return;
      }
      final pos = await Geolocator.getCurrentPosition();
      setState(() {
        _lat = pos.latitude;
        _lng = pos.longitude;
        _message = null;
      });
    } catch (e) {
      setState(() => _message = 'Could not get location: $e');
    }
  }

  Future<void> _submit() async {
    if (_title.text.trim().isEmpty || _lat == null || _lng == null) {
      setState(() => _message = 'Title and location are required.');
      return;
    }
    setState(() {
      _busy = true;
      _message = 'Submitting…';
    });

    try {
      String? imageUrl;
      if (_photo != null) {
        imageUrl = await _data.uploadImage(_photo!);
      }
      final id = await _data.createReport(
        title: _title.text.trim(),
        description: _description.text.trim(),
        category: _category ?? 'other',
        latitude: _lat!,
        longitude: _lng!,
        addressText: _address.text.trim().isEmpty ? null : _address.text.trim(),
        imageUrl: imageUrl,
      );
      setState(() {
        _message = id != null ? 'Report submitted!' : 'Submission failed.';
        if (id != null) {
          _title.clear();
          _description.clear();
          _address.clear();
          _photo = null;
          _lat = null;
          _lng = null;
        }
      });
    } catch (e) {
      setState(() => _message = 'Error: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Report an issue',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        TextField(
          controller: _title,
          decoration: const InputDecoration(
              labelText: 'Title', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          value: _category,
          decoration: const InputDecoration(
              labelText: 'Category', border: OutlineInputBorder()),
          items: _categories
              .map((c) => DropdownMenuItem(value: c.id, child: Text(c.label)))
              .toList(),
          onChanged: (v) => setState(() => _category = v),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _description,
          maxLines: 4,
          decoration: const InputDecoration(
              labelText: 'Description', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: _pickPhoto,
          icon: const Icon(Icons.photo_camera_outlined),
          label: Text(_photo == null ? 'Add photo' : 'Photo selected'),
        ),
        if (_photo != null) ...[
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.file(_photo!, height: 160, fit: BoxFit.cover),
          ),
        ],
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: _useLocation,
          icon: const Icon(Icons.my_location),
          label: Text(_lat == null
              ? 'Use my location'
              : '${_lat!.toStringAsFixed(5)}, ${_lng!.toStringAsFixed(5)}'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _address,
          decoration: const InputDecoration(
              labelText: 'Address (optional)', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _busy ? null : _submit,
          child: Text(_busy ? 'Working…' : 'Submit report'),
        ),
        if (_message != null) ...[
          const SizedBox(height: 12),
          Text(_message!, style: const TextStyle(color: Colors.grey)),
        ],
      ],
    );
  }
}
