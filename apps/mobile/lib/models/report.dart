class Report {
  final String id;
  final String title;
  final String description;
  final String category;
  final String priority;
  final String status;
  final double latitude;
  final double longitude;
  final String? addressText;
  final String? imageUrl;
  final int supportCount;
  final DateTime? createdAt;

  Report({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.priority,
    required this.status,
    required this.latitude,
    required this.longitude,
    this.addressText,
    this.imageUrl,
    this.supportCount = 0,
    this.createdAt,
  });

  factory Report.fromJson(Map<String, dynamic> json) {
    return Report(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      category: json['category'] as String? ?? 'other',
      priority: json['priority'] as String? ?? 'medium',
      status: json['status'] as String? ?? 'submitted',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
      addressText: json['address_text'] as String?,
      imageUrl: json['image_url'] as String?,
      supportCount: (json['support_count'] as num?)?.toInt() ?? 0,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
    );
  }
}

class Category {
  final String id;
  final String label;

  Category({required this.id, required this.label});

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: json['id'] as String,
        label: json['label'] as String? ?? json['id'] as String,
      );
}
