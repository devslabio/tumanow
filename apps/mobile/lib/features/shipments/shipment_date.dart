import 'package:flutter/material.dart';

String? shipmentCompletionLabel(BuildContext context, Map<String, dynamic> shipment) {
  final isCompleted = shipment['completedAt'] != null;
  final raw = isCompleted ? shipment['completedAt'] : shipment['deliveredAt'];
  return _timestampLabel(
    context,
    isCompleted ? 'Completed' : 'Delivered',
    raw,
  );
}

String? shipmentCreatedLabel(BuildContext context, Map<String, dynamic> shipment) {
  return _timestampLabel(context, 'Created', shipment['createdAt']);
}

String? _timestampLabel(BuildContext context, String label, dynamic raw) {
  if (raw == null) return null;

  final timestamp = DateTime.tryParse(raw.toString())?.toLocal();
  if (timestamp == null) return null;

  final localizations = MaterialLocalizations.of(context);
  final date = localizations.formatMediumDate(timestamp);
  final time = localizations.formatTimeOfDay(TimeOfDay.fromDateTime(timestamp));
  return '$label $date at $time';
}
