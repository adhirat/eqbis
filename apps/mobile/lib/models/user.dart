class UserModel {
  final String id;
  final String email;
  final String name;
  final String orgId;
  final String orgSlug;
  final List<String> roles;
  final List<String> permissions;
  final String? photo;

  const UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.orgId,
    required this.orgSlug,
    required this.roles,
    required this.permissions,
    this.photo,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
    id:          json['id']      as String,
    email:       json['email']   as String,
    name:        json['name']    as String,
    orgId:       json['orgId']   as String,
    orgSlug:     json['orgSlug'] as String,
    roles:       List<String>.from(json['roles'] as List),
    permissions: List<String>.from(json['permissions'] as List),
    photo:       json['photo']   as String?,
  );

  bool hasPermission(String perm) => permissions.contains(perm);
}
