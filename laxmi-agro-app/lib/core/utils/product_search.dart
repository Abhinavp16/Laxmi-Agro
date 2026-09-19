class ProductSearchCriteria {
  final String query;
  final String? categoryId;
  final String? brandId;

  const ProductSearchCriteria({this.query = '', this.categoryId, this.brandId});

  bool get isActive =>
      query.trim().isNotEmpty || categoryId != null || brandId != null;

  Map<String, dynamic> toQueryParameters({
    required int page,
    required int limit,
  }) {
    final trimmedQuery = query.trim();
    return {
      'page': page,
      'limit': limit,
      if (trimmedQuery.isNotEmpty) 'q': trimmedQuery,
      if (categoryId != null) 'categoryId': categoryId,
      if (brandId != null) 'brandId': brandId,
    };
  }

  @override
  bool operator ==(Object other) {
    return other is ProductSearchCriteria &&
        other.query.trim() == query.trim() &&
        other.categoryId == categoryId &&
        other.brandId == brandId;
  }

  @override
  int get hashCode => Object.hash(query.trim(), categoryId, brandId);
}

class ProductSearchPage {
  final List<dynamic> items;
  final int page;
  final bool hasNext;

  const ProductSearchPage({
    required this.items,
    required this.page,
    required this.hasNext,
  });

  factory ProductSearchPage.fromJson(Map<String, dynamic> body) {
    final pagination = body['pagination'];
    final paginationMap = pagination is Map ? pagination : const {};
    return ProductSearchPage(
      items: body['data'] is List ? body['data'] as List : const [],
      page: (paginationMap['page'] as num?)?.toInt() ?? 1,
      hasNext: paginationMap['hasNext'] == true,
    );
  }
}

List<Map<String, dynamic>> mergeSearchItems(
  List<Map<String, dynamic>> existing,
  List<Map<String, dynamic>> incoming,
) {
  final byId = <String, Map<String, dynamic>>{
    for (final item in existing) item['id']?.toString() ?? '': item,
  }..remove('');
  for (final item in incoming) {
    final id = item['id']?.toString() ?? '';
    if (id.isNotEmpty) byId[id] = item;
  }
  return byId.values.toList();
}
