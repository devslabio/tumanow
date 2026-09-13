import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../shipments/shipments_api.dart';

class TrackScreen extends ConsumerStatefulWidget {
  const TrackScreen({super.key});
  @override
  ConsumerState<TrackScreen> createState() => _TrackScreenState();
}

class _TrackScreenState extends ConsumerState<TrackScreen> {
  final _number = TextEditingController(text: 'TN-2026-00001234');
  Map<String, dynamic>? _result;
  String? _error;
  bool _loading = false;

  @override
  void dispose() {
    _number.dispose();
    super.dispose();
  }

  Future<void> _track() async {
    setState(() {
      _loading = true;
      _error = null;
      _result = null;
    });
    try {
      final res = await ref.read(shipmentsApiProvider).track(_number.text.trim());
      setState(() => _result = res);
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Track')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _number,
            decoration: const InputDecoration(labelText: 'Tracking number'),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _loading ? null : _track,
            child: Text(_loading ? 'Searching…' : 'Track'),
          ),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
          if (_result != null) ...[
            const SizedBox(height: 16),
            Text(_result!['status']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            ...(((_result!['events'] as List?) ?? [])).map((e) {
              final ev = Map<String, dynamic>.from(e as Map);
              return ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(ev['status']?.toString() ?? ''),
                subtitle: Text(ev['note']?.toString() ?? ''),
              );
            }),
          ],
        ],
      ),
    );
  }
}
