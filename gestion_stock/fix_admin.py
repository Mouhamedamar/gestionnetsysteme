from django.contrib.auth.models import User

# Try to get or create admin user
admin, created = User.objects.get_or_create(username='admin')

# Set all necessary fields
admin.set_password('admin123')
admin.email = 'admin@example.com'
admin.is_staff = True
admin.is_superuser = True
admin.is_active = True
admin.save()

print(f"Admin user {'created' if created else 'updated'} successfully")
print("Username: admin")
print("Password: admin123")
print(f"is_staff: {admin.is_staff}")
print(f"is_superuser: {admin.is_superuser}")
print(f"is_active: {admin.is_active}")
