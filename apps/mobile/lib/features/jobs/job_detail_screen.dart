import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_colors.dart';
import 'jobs_screen.dart';
import 'rider_api.dart';

const kFailureReasons = <String>[
  'CUSTOMER_UNAVAILABLE',
  'RECIPIENT_UNAVAILABLE',
  'WRONG_ADDRESS',
  'RECIPIENT_REFUSED',
  'PACKAGE_DAMAGED',
  'PACKAGE_LOST',
  'VEHICLE_BREAKDOWN',
  'DRIVER_UNAVAILABLE',
  'BAD_WEATHER',
  'ROAD_INACCESSIBLE',
  'PAYMENT_PROBLEM',
  'PACKAGE_EXCEEDS_LIMITS',
  'SECURITY_ISSUE',
  'OTHER',
];

class JobDetailScreen extends ConsumerStatefulWidget {
  const JobDetailScreen({super.key, required this.id});
  final String id;
  @override
  ConsumerState<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends ConsumerState<JobDetailScreen> {
  Map<String, dynamic>? _row;
  String? _error;
  bool _loading = true;
  bool _busy = false;
  String? _podSentTo;
  final _otp = TextEditingController();
  final _recipient = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _otp.dispose();
    _recipient.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final row = await ref.read(riderApiProvider).get(widget.id);
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

  Future<void> _run(Future<void> Function() action, {String? ok}) async {
    setState(() => _busy = true);
    try {
      await action();
      await _load();
      ref.invalidate(jobsProvider);
      if (!mounted) return;
      if (ok != null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ok)));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<String?> _pickFailureReason() {
    return showDialog<String>(
      context: context,
      builder: (context) => SimpleDialog(
        title: const Text('Why did delivery fail?'),
        children: [
          for (final reason in kFailureReasons)
            SimpleDialogOption(
              onPressed: () => Navigator.pop(context, reason),
              child: Text(reason.replaceAll('_', ' ')),
            ),
        ],
      ),
    );
  }

  List<String> _nextStatuses(String current) {
    const map = {
      'ASSIGNED': ['PICKED_UP', 'FAILED'],
      'PICKED_UP': ['IN_TRANSIT', 'FAILED'],
      'IN_TRANSIT': ['OUT_FOR_DELIVERY', 'FAILED'],
      'OUT_FOR_DELIVERY': ['DELIVERED', 'FAILED'],
    };
    return map[current] ?? [];
  }

  @override
  Widget build(BuildContext context) {
    final row = _row;
    return Scaffold(
      appBar: AppBar(title: Text(row?['trackingNumber']?.toString() ?? 'Job')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text(row!['status']?.toString() ?? '',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
                    const SizedBox(height: 8),
                    Text('Pickup: ${row['pickupAddress']}'),
                    Text('Drop-off: ${row['deliveryAddress']}'),
                    if (row['isCod'] == true)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          'COD ${row['codStatus']} · ${row['codAmount'] ?? row['finalPrice']} RWF',
                          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                        ),
                      ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final s in _nextStatuses(row['status']?.toString() ?? ''))
                          FilledButton(
                            onPressed: _busy
                                ? null
                                : () async {
                                    String? reason;
                                    if (s == 'FAILED') {
                                      reason = await _pickFailureReason();
                                      if (reason == null) return;
                                    }
                                    await _run(() => ref
                                        .read(riderApiProvider)
                                        .updateStatus(widget.id, s, failureReason: reason));
                                  },
                            child: Text(s),
                          ),
                        FilledButton.tonal(
                          onPressed: _busy
                              ? null
                              : () => _run(() async {
                                    final res = await ref.read(riderApiProvider).generatePod(widget.id);
                                    setState(() => _podSentTo = res['podOtpSentTo']?.toString());
                                  }, ok: 'Delivery code sent to recipient'),
                          child: const Text('Generate POD'),
                        ),
                        if (row['isCod'] == true && row['codStatus'] == 'PENDING')
                          OutlinedButton(
                            onPressed: _busy
                                ? null
                                : () => _run(() => ref.read(riderApiProvider).collectCod(widget.id),
                                    ok: 'COD collected'),
                            child: const Text('Collect COD'),
                          ),
                      ],
                    ),
                    if (_podSentTo != null) ...[
                      const SizedBox(height: 12),
                      Text('Delivery code sent to $_podSentTo',
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                    ],
                    if (row['status'] == 'OUT_FOR_DELIVERY') ...[
                      const SizedBox(height: 20),
                      const Text('Verify POD', style: TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      TextField(controller: _otp, decoration: const InputDecoration(labelText: 'OTP')),
                      const SizedBox(height: 8),
                      TextField(controller: _recipient, decoration: const InputDecoration(labelText: 'Recipient name')),
                      const SizedBox(height: 8),
                      FilledButton(
                        onPressed: _busy || _otp.text.isEmpty
                            ? null
                            : () => _run(
                                  () => ref.read(riderApiProvider).verifyPod(
                                        widget.id,
                                        otp: _otp.text.trim(),
                                        recipientName: _recipient.text.trim().isEmpty
                                            ? null
                                            : _recipient.text.trim(),
                                      ),
                                  ok: 'Delivered',
                                ),
                        child: const Text('Verify & deliver'),
                      ),
                    ],
                  ],
                ),
    );
  }
}
