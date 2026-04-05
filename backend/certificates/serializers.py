from rest_framework import serializers
from .models import Certificate
from accounts.serializers import UserSerializer
from datetime import date


class CertificateSerializer(serializers.ModelSerializer):
    """Full certificate details with nested student/faculty info."""
    student_name = serializers.SerializerMethodField()
    faculty_name = serializers.SerializerMethodField()
    category_display = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            'id', 'student', 'student_name', 'faculty', 'faculty_name',
            'title', 'organization', 'category', 'category_display', 'skill_tags',
            'issue_date', 'expiry_date',
            'file', 'status', 'remarks', 'created_at'
        ]
        read_only_fields = ['id', 'student', 'faculty', 'status', 'remarks', 'created_at']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.username

    def get_faculty_name(self, obj):
        if obj.faculty:
            return f"{obj.faculty.first_name} {obj.faculty.last_name}".strip() or obj.faculty.username
        return "Not assigned"

    def get_category_display(self, obj):
        return obj.get_category_display()


class CertificateUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading a new certificate."""

    class Meta:
        model = Certificate
        fields = ['title', 'organization', 'category', 'skill_tags', 'issue_date', 'expiry_date', 'file']

    def validate_file(self, value):
        allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png']
        ext = value.name.split('.')[-1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                f"Unsupported file type '.{ext}'. Allowed: {', '.join(allowed_extensions)}"
            )
        if value.size > 10 * 1024 * 1024:  # 10MB limit
            raise serializers.ValidationError("File size must be under 10MB.")
        return value

    def validate_expiry_date(self, value):
        """Reject certificates that are already expired."""
        if value and value < date.today():
            raise serializers.ValidationError(
                f"This certificate has already expired on {value.strftime('%B %d, %Y')}. "
                "You cannot upload an expired certificate."
            )
        return value

    def validate(self, data):
        """Ensure expiry date is after issue date."""
        issue = data.get('issue_date')
        expiry = data.get('expiry_date')
        if issue and expiry and expiry <= issue:
            raise serializers.ValidationError({
                'expiry_date': "Expiry date must be after the issue date."
            })
        return data


class CertificateReviewSerializer(serializers.Serializer):
    """Serializer for faculty reviewing (accept/reject) a certificate."""
    status = serializers.ChoiceField(choices=['accepted', 'rejected'])
    remarks = serializers.CharField(required=False, allow_blank=True, default='')

