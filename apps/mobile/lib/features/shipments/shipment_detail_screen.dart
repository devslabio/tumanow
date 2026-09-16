import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import '../auth/session.dart';
import 'shipments_api.dart';
import 'shipment_date.dart';

class ShipmentDetailScreen extends ConsumerStatefulWidget {
  const ShipmentDetailScreen({super.key, required this.id});
  final String id;
  @override
  ConsumerState<ShipmentDetailScreen> createState() => _ShipmentDetailScreenState();
}

class _ShipmentDetailScreenState extends ConsumerState<ShipmentDetailScreen> {
  Map<String, dynamic>? _row;
  String? _error;
  bool _loading = true;
  bool _paying = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final row = await ref.read(shipmentsApiProvider).get(widget.id);
      if (!mounted) return;
      setState(() {
        _row = row;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = '$e';
        _loading = false;
      });
    }
  }

  Future<void> _pay() async {
    setState(() => _paying = true);
    try {
      final phone = ref.read(sessionProvider)?.user.phone;
      await ref.read(shipmentsApiProvider).pay(
            widget.id,
            method: 'MTN_MOMO',
            payerPhone: phone,
          );
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payment completed (sandbox)')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _paying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final row = _row;
    final created = row == null ? null : shipmentCreatedLabel(context, row);
    final completion = row == null ? null : shipmentCompletionLabel(context, row);
    final creator = row == null
        ? null
        : _creatorName(row) ?? ref.read(sessionProvider)?.user.displayName;
    return Scaffold(
      appBar: AppBar(title: Text(row?['trackingNumber']?.toString() ?? 'Shipment')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Shipment receipt',
                              style: TextStyle(
                                color: AppColors.navy,
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const Divider(height: 24),
                            _ReceiptLine('Tracking number', row!['trackingNumber']?.toString() ?? '—'),
                            _ReceiptLine('Created by', creator ?? '—'),
                            _ReceiptLine('Created', created ?? '—'),
                            _ReceiptLine('Status', row!['status']?.toString() ?? '—'),
                            _ReceiptLine(
                              'Route',
                              '${row!['pickupAddress']} → ${row!['deliveryAddress']}',
                            ),
                            _ReceiptLine(
                              'Amount',
                              '${row!['finalPrice'] ?? row!['quotedPrice'] ?? '—'} RWF'
                              '${row!['isCod'] == true ? ' · COD' : ''}',
                            ),
                            if (completion != null)
                              _ReceiptLine('Delivery complete', completion),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (row!['pickupContactName'] != null || row!['pickupContactPhone'] != null) ...[
                      const Text('Pickup contact', style: TextStyle(fontWeight: FontWeight.w700)),
                      Text(_contact(row!['pickupContactName'], row!['pickupContactPhone'])),
                    ],
                    if (row!['deliveryContactName'] != null || row!['deliveryContactPhone'] != null) ...[
                      const SizedBox(height: 12),
                      const Text('Delivery contact', style: TextStyle(fontWeight: FontWeight.w700)),
                      Text(_contact(row!['deliveryContactName'], row!['deliveryContactPhone'])),
                    ],
                    const SizedBox(height: 16),
                    if (row!['isCod'] != true &&
                        ['AWAITING_PAYMENT', 'APPROVED'].contains(row!['status']))
                      FilledButton(
                        onPressed: _paying ? null : _pay,
                        child: Text(_paying ? 'Paying…' : 'Pay with MoMo'),
                      ),
                    const SizedBox(height: 24),
                    const Text('Timeline', style: TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 8),
                    ...((row!['events'] as List?) ?? []).map((e) {
                      final ev = Map<String, dynamic>.from(e as Map);
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(ev['status']?.toString() ?? ''),
                        subtitle: Text(ev['note']?.toString() ?? ''),
                      );
                    }),
                  ],
                ),
    );
  }

  String _contact(dynamic name, dynamic phone) {
    return [name, phone]
        .whereType<Object>()
        .map((value) => value.toString())
        .where((value) => value.isNotEmpty)
        .join(' · ');
  }

  String? _creatorName(Map<String, dynamic> shipment) {
    final customer = shipment['customer'];
    if (customer is! Map) return null;
    final values = [
      customer['fullName'],
      customer['companyName'],
      if (customer['user'] is Map) customer['user']['fullName'],
    ];
    for (final value in values) {
      final name = value?.toString().trim();
      if (name != null && name.isNotEmpty) return name;
    }
    return null;
  }
}

class _ReceiptLine extends StatelessWidget {
  const _ReceiptLine(this.label, this.value);
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 118,
            child: Text(label, style: const TextStyle(color: AppColors.muted)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
