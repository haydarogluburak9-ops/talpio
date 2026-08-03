/// Backend'in standart yanıt zarfı: `{ success, data, meta }`.
class ApiResponse<T> {
  const ApiResponse({required this.data, this.meta});

  final T data;
  final Map<String, dynamic>? meta;
}

/// Sayfalama bilgisi.
class PageMeta {
  const PageMeta({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
    required this.hasNext,
    required this.hasPrevious,
  });

  factory PageMeta.fromJson(Map<String, dynamic> json) {
    return PageMeta(
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 0,
      total: json['total'] as int? ?? 0,
      totalPages: json['totalPages'] as int? ?? 0,
      hasNext: json['hasNext'] as bool? ?? false,
      hasPrevious: json['hasPrevious'] as bool? ?? false,
    );
  }

  final int page;
  final int limit;
  final int total;
  final int totalPages;
  final bool hasNext;
  final bool hasPrevious;
}
