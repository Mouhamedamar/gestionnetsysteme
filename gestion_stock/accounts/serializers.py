from rest_framework import serializers
from .models import Client, UserProfile
from django.contrib.auth.models import User


class ClientSerializer(serializers.ModelSerializer):
    """
    Serializer for the Client model
    """
    class Meta:
        model = Client
        fields = ['id', 'name', 'phone', 'email', 'address', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_email(self, value):
        """
        Validate the email
        """
        if value:
            # Check if email is not already used by another client
            qs = Client.objects.filter(email=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("A client with this email already exists.")
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the UserProfile model
    """
    class Meta:
        model = UserProfile
        fields = ['id', 'role', 'phone', 'page_permissions', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'page_permissions': {'required': False, 'allow_null': True}
        }


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model
    """
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    role = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()
    page_permissions_read = serializers.SerializerMethodField()
    # Permettre d'écrire le rôle directement
    role_write = serializers.ChoiceField(
        choices=['admin', 'technicien', 'commercial'],
        write_only=True,
        required=False,
        allow_blank=True
    )
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    page_permissions = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        allow_null=True,
        allow_empty=True,
        help_text="Liste des chemins de pages autorisés. null = permissions par défaut, [] = aucun accès, [paths...] = permissions spécifiques"
    )
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'is_staff', 'is_active', 'date_joined', 'role', 'role_write', 'phone', 'page_permissions', 'page_permissions_read', 'profile']
        read_only_fields = ['id', 'date_joined']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }
    
    def get_role(self, obj):
        """Retourne le rôle de l'utilisateur depuis son profil"""
        try:
            if hasattr(obj, 'profile'):
                profile = getattr(obj, 'profile', None)
                if profile:
                    return profile.role
        except (AttributeError, UserProfile.DoesNotExist):
            pass
        return 'commercial'
    
    def get_profile(self, obj):
        """Retourne le profil utilisateur en gérant les cas d'erreur"""
        try:
            if hasattr(obj, 'profile') and obj.profile:
                return UserProfileSerializer(obj.profile).data
        except (AttributeError, UserProfile.DoesNotExist, Exception):
            # Si le profil n'existe pas, retourner None ou un profil par défaut
            return None
        return None
    
    def get_page_permissions_read(self, obj):
        """Retourne les permissions en lecture seule"""
        try:
            if hasattr(obj, 'profile'):
                profile = getattr(obj, 'profile', None)
                if profile and hasattr(profile, 'page_permissions'):
                    return profile.page_permissions if profile.page_permissions else None
        except (AttributeError, UserProfile.DoesNotExist, TypeError):
            # Le champ n'existe pas encore ou erreur d'accès
            return None
        except Exception as e:
            # Autre erreur - logger pour debug
            print(f"Erreur get_page_permissions_read: {e}")
            return None
        return None

    def validate_email(self, value):
        """
        Validate the email
        """
        if value:
            qs = User.objects.filter(email=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("Un utilisateur avec cet email existe déjà.")
        return value

    def validate_username(self, value):
        """
        Validate the username
        """
        qs = User.objects.filter(username=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà pris.")
        return value
    
    def validate_page_permissions(self, value):
        """
        Validate page_permissions
        - None/null = utiliser les permissions par défaut
        - [] = aucun accès
        - [paths...] = permissions spécifiques
        """
        # Si c'est None, le retourner tel quel (sera stocké comme None dans la DB)
        if value is None:
            return None
        # Si c'est un tableau, le retourner tel quel
        return value

    def create(self, validated_data):
        """
        Create a new user
        """
        password = validated_data.pop('password', None)
        role = validated_data.pop('role_write', 'commercial')
        phone = validated_data.pop('phone', None)
        page_permissions = validated_data.pop('page_permissions', None)
        
        if not password:
            raise serializers.ValidationError({"password": "Le mot de passe est requis pour créer un utilisateur."})
        
        # Si admin, s'assurer que is_staff=True
        if role == 'admin':
            validated_data['is_staff'] = True
            validated_data['is_superuser'] = True
        
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Créer le profil utilisateur
        # Si page_permissions est None ou un tableau vide [], utiliser None (permissions par défaut uniquement)
        # Si page_permissions contient des valeurs, les stocker (seront combinées avec les permissions par défaut)
        permissions_value = page_permissions if (page_permissions is not None and len(page_permissions) > 0) else None
        UserProfile.objects.create(
            user=user,
            role=role,
            phone=phone,
            page_permissions=permissions_value
        )
        
        return user

    def update(self, instance, validated_data):
        """
        Update an existing user
        """
        password = validated_data.pop('password', None)
        role = validated_data.pop('role_write', None)
        phone = validated_data.pop('phone', None)
        page_permissions = validated_data.pop('page_permissions', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        # Mettre à jour le profil si nécessaire
        # Si page_permissions n'est pas fourni (None), on ne modifie pas les permissions existantes
        # Si page_permissions est un tableau vide [], utiliser None (permissions par défaut uniquement)
        # Si page_permissions contient des valeurs, les stocker (seront combinées avec les permissions par défaut)
        profile, created = UserProfile.objects.get_or_create(
            user=instance,
            defaults={'role': role or 'commercial', 'phone': phone}
        )
        
        if not created:
            if role is not None and role != '':
                profile.role = role
            if phone is not None:
                profile.phone = phone
            # Mettre à jour les permissions si fournies
            # None = ne pas modifier, [] = permissions par défaut uniquement, [paths...] = permissions supplémentaires
            if page_permissions is not None:
                # Si c'est un tableau vide, stocker None pour utiliser uniquement les permissions par défaut
                profile.page_permissions = page_permissions if len(page_permissions) > 0 else None
            profile.save()
        else:
            # Si le profil vient d'être créé, définir les permissions
            if page_permissions is not None:
                # Si c'est un tableau vide, stocker None pour utiliser uniquement les permissions par défaut
                profile.page_permissions = page_permissions if len(page_permissions) > 0 else None
                profile.save()
        
        # Si admin, s'assurer que is_staff=True
        if role == 'admin':
            instance.is_staff = True
            instance.is_superuser = True
        
        instance.save()
        return instance