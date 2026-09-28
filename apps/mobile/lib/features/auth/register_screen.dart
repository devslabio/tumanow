import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/network/api_error.dart';
import '../../core/theme/app_colors.dart';
import 'session.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _companyName = TextEditingController();
  String _accountType = 'INDIVIDUAL';
  bool _loading = false;
  bool _obscure = true;

  @override
  void dispose() {
    _fullName.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _companyName.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_accountType == 'BUSINESS' && _companyName.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter your company name')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      final data = await ref.read(authApiProvider).register(
            email: _email.text.trim(),
            password: _password.text,
            fullName: _fullName.text.trim(),
            phone: _phone.text.trim(),
            accountType: _accountType,
            companyName: _companyName.text.trim(),
          );
      await ref.read(sessionProvider.notifier).applyAuthResponse(data);
      if (!mounted) return;
      final home = ref.read(sessionProvider)?.homePath ?? '/home';
      context.go(home);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(apiErrorMessage(e))),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: AppColors.navy,
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Create your account',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.navy,
                      ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Ship as an individual, or register your company for team access and postpaid billing.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.muted),
                ),
                const SizedBox(height: 24),
                DropdownButtonFormField<String>(
                  initialValue: _accountType,
                  decoration: const InputDecoration(labelText: 'Account type'),
                  items: const [
                    DropdownMenuItem(value: 'INDIVIDUAL', child: Text('Individual')),
                    DropdownMenuItem(value: 'BUSINESS', child: Text('Business')),
                  ],
                  onChanged: (v) => setState(() => _accountType = v ?? 'INDIVIDUAL'),
                ),
                if (_accountType == 'BUSINESS') ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: _companyName,
                    decoration: const InputDecoration(
                      labelText: 'Company name',
                      hintText: 'Acme Logistics Ltd',
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                TextField(
                  controller: _fullName,
                  decoration: const InputDecoration(labelText: 'Full name'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone (optional)',
                    hintText: '+250788123456',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _password,
                  obscureText: _obscure,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    hintText: 'At least 8 characters',
                    suffixIcon: IconButton(
                      onPressed: () => setState(() => _obscure = !_obscure),
                      icon: Icon(
                        _obscure
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _loading ? null : _submit,
                  child: Text(_loading ? 'Creating account…' : 'Create account'),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: _loading ? null : () => context.go('/login'),
                  child: const Text('Already have an account? Log in'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
