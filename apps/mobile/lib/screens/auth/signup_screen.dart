import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/auth_service.dart';
import '../../theme/theme.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _form     = GlobalKey<FormState>();
  final _name     = TextEditingController();
  final _email    = TextEditingController();
  final _password = TextEditingController();
  final _orgName  = TextEditingController();
  final _orgSlug  = TextEditingController();
  bool _loading   = false;
  String? _error;

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });

    try {
      await authService.register(
        email:    _email.text.trim(),
        password: _password.text,
        fullName: _name.text.trim(),
        orgName:  _orgName.text.trim(),
        orgSlug:  _orgSlug.text.trim().toLowerCase(),
      );
      if (mounted) context.go('/portal/dashboard');
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); });
    } finally {
      if (mounted) setState(() { _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: BackButton(onPressed: () => context.go('/auth/login')),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Form(
              key: _form,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Create account', style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 4),
                  Text('Set up your organisation on Eqbis', style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 24),

                  if (_error != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: EqbisTheme.danger.withAlpha(20),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: EqbisTheme.danger.withAlpha(60)),
                      ),
                      child: Text(_error!, style: const TextStyle(color: EqbisTheme.danger, fontSize: 13)),
                    ),
                    const SizedBox(height: 16),
                  ],

                  TextFormField(
                    controller: _name,
                    decoration: const InputDecoration(labelText: 'Full Name'),
                    textInputAction: TextInputAction.next,
                    validator: (v) => (v?.isEmpty ?? true) ? 'Name is required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _email,
                    decoration: const InputDecoration(labelText: 'Work Email'),
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    autocorrect: false,
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Email is required';
                      if (!v.contains('@')) return 'Enter a valid email';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _password,
                    decoration: const InputDecoration(labelText: 'Password'),
                    obscureText: true,
                    textInputAction: TextInputAction.next,
                    validator: (v) {
                      if (v == null || v.length < 8) return 'Minimum 8 characters';
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  const Divider(),
                  const SizedBox(height: 12),
                  Text('Organisation', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _orgName,
                    decoration: const InputDecoration(labelText: 'Organisation Name'),
                    textInputAction: TextInputAction.next,
                    onChanged: (v) {
                      _orgSlug.text = v.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '-').replaceAll(RegExp(r'-+'), '-').replaceAll(RegExp(r'^-|-$'), '');
                    },
                    validator: (v) => (v?.isEmpty ?? true) ? 'Organisation name is required' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _orgSlug,
                    decoration: const InputDecoration(
                      labelText: 'Subdomain',
                      suffixText: '.eqbis.com',
                    ),
                    autocorrect: false,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _submit(),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Subdomain is required';
                      if (!RegExp(r'^[a-z0-9-]+$').hasMatch(v)) return 'Only lowercase letters, numbers, hyphens';
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    child: _loading
                      ? const SizedBox(width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Create Account'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _name.dispose(); _email.dispose(); _password.dispose();
    _orgName.dispose(); _orgSlug.dispose();
    super.dispose();
  }
}
