import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'shipments_api.dart';

class NewShipmentScreen extends ConsumerStatefulWidget {
  const NewShipmentScreen({super.key});
  @override
  ConsumerState<NewShipmentScreen> createState() => _NewShipmentScreenState();
}

class _NewShipmentScreenState extends ConsumerState<NewShipmentScreen> {
  final _pickup = TextEditingController(text: 'Kacyiru');
  final _pickupCity = TextEditingController(text: 'Kigali');
  final _delivery = TextEditingController(text: 'Remera');
  final _deliveryCity = TextEditingController(text: 'Kigali');
  final _weight = TextEditingController(text: '1');
  bool _isCod = false;
  bool _loading = false;
  List<Map<String, dynamic>> _options = [];
  String? _selectedOperatorId;

  @override
  void dispose() {
    _pickup.dispose();
    _pickupCity.dispose();
    _delivery.dispose();
    _deliveryCity.dispose();
    _weight.dispose();
    super.dispose();
  }

  Future<void> _match() async {
    setState(() => _loading = true);
    try {
      final options = await ref.read(shipmentsApiProvider).match({
        'pickupCity': _pickupCity.text.trim(),
        'deliveryCity': _deliveryCity.text.trim(),
        'weightKg': double.tryParse(_weight.text) ?? 1,
        'deliveryService': 'STANDARD',
        'estimatedDistanceKm': 5,
      });
      setState(() {
        _options = options;
        _selectedOperatorId = options.isNotEmpty ? options.first['operatorId']?.toString() : null;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _create() async {
    if (_selectedOperatorId == null) return;
    setState(() => _loading = true);
    try {
      final shipment = await ref.read(shipmentsApiProvider).create({
        'operatorId': _selectedOperatorId,
        'pickupAddress': _pickup.text.trim(),
        'pickupCity': _pickupCity.text.trim(),
        'deliveryAddress': _delivery.text.trim(),
        'deliveryCity': _deliveryCity.text.trim(),
        'deliveryService': 'STANDARD',
        'estimatedDistanceKm': 5,
        'isCod': _isCod,
        'packages': [
          {
            'description': 'General parcel',
            'quantity': 1,
            'weightKg': double.tryParse(_weight.text) ?? 1,
          }
        ],
      });
      if (!mounted) return;
      context.go('/shipments/${shipment['id']}');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New shipment')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(controller: _pickup, decoration: const InputDecoration(labelText: 'Pickup address')),
          const SizedBox(height: 10),
          TextField(controller: _pickupCity, decoration: const InputDecoration(labelText: 'Pickup city')),
          const SizedBox(height: 10),
          TextField(controller: _delivery, decoration: const InputDecoration(labelText: 'Delivery address')),
          const SizedBox(height: 10),
          TextField(controller: _deliveryCity, decoration: const InputDecoration(labelText: 'Delivery city')),
          const SizedBox(height: 10),
          TextField(controller: _weight, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Weight (kg)')),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Cash on delivery'),
            value: _isCod,
            onChanged: (v) => setState(() => _isCod = v),
          ),
          FilledButton(
            onPressed: _loading ? null : _match,
            child: Text(_loading ? 'Matching…' : 'Find operators'),
          ),
          const SizedBox(height: 16),
          ..._options.map((opt) {
            final id = opt['operatorId']?.toString();
            final selected = id == _selectedOperatorId;
            return Card(
              child: ListTile(
                selected: selected,
                onTap: () => setState(() => _selectedOperatorId = id),
                title: Text(opt['tradingName']?.toString() ?? opt['legalName']?.toString() ?? 'Operator'),
                trailing: Text('${opt['price']} ${opt['currency'] ?? 'RWF'}'),
              ),
            );
          }),
          if (_selectedOperatorId != null) ...[
            const SizedBox(height: 12),
            FilledButton(
              onPressed: _loading ? null : _create,
              child: const Text('Confirm shipment'),
            ),
          ],
        ],
      ),
    );
  }
}
