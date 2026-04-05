import random
import string
from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils import timezone

from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token

from .models import CustomUser
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, AdminUserSerializer


# ──────────────────────────── Registration ────────────────────────────

class RegisterView(APIView):
    """Register a new student or faculty user."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)

            return Response({
                'message': 'Registration successful!',
                'token': token.key,
                'user': UserSerializer(user).data,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ──────────────────────────── Login ────────────────────────────

class LoginView(APIView):
    """Login and receive an auth token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data,
                'message': 'Login successful.'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ──────────────────────────── Profile ────────────────────────────

class ProfileView(APIView):
    """View and update the current user's profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ──────────────────────────── Admin Users ────────────────────────────

class AdminUserListView(APIView):
    """Admin-only: List all users or delete a user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        users = CustomUser.objects.all().order_by('-date_joined')
        return Response(AdminUserSerializer(users, many=True).data)

    def delete(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user = CustomUser.objects.get(pk=pk)
            user.delete()
            return Response({'message': 'User deleted.'}, status=status.HTTP_204_NO_CONTENT)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


# ──────────────────────── Forgot Password ────────────────────────

def _generate_otp():
    """Generate a 6-digit numeric OTP."""
    return ''.join(random.choices(string.digits, k=6))


def _otp_cache_key(email):
    """Return a consistent cache key for the given email."""
    return f'pwd_reset_otp_{email.lower().strip()}'


class ForgotPasswordView(APIView):
    """Send a 6-digit OTP to the user's registered email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response(
                {'error': 'Email address is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Look up user by email (case-insensitive)
        try:
            user = CustomUser.objects.get(email__iexact=email)
        except CustomUser.DoesNotExist:
            # Return a generic success message to prevent email enumeration
            return Response({
                'message': 'If an account with that email exists, a reset code has been sent.',
            })

        otp = _generate_otp()

        # Store OTP in Django's cache for 10 minutes
        cache.set(_otp_cache_key(email), otp, timeout=600)

        # Send email
        try:
            send_mail(
                subject='CertTrack — Password Reset Code',
                message=(
                    f'Hello {user.first_name or user.username},\n\n'
                    f'Your password reset verification code is:\n\n'
                    f'    {otp}\n\n'
                    f'This code is valid for 10 minutes.\n\n'
                    f'If you did not request a password reset, please ignore this email.\n\n'
                    f'— The CertTrack Team'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception:
            return Response(
                {'error': 'Failed to send email. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({
            'message': 'If an account with that email exists, a reset code has been sent.',
        })


class ResetPasswordView(APIView):
    """Verify OTP and set a new password."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()
        new_password = request.data.get('new_password', '')

        if not email or not otp or not new_password:
            return Response(
                {'error': 'Email, OTP, and new password are all required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 6:
            return Response(
                {'error': 'Password must be at least 6 characters.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify OTP from cache
        stored_otp = cache.get(_otp_cache_key(email))
        if not stored_otp or stored_otp != otp:
            return Response(
                {'error': 'Invalid or expired verification code.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find user
        try:
            user = CustomUser.objects.get(email__iexact=email)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'No account found with that email.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Set new password
        user.set_password(new_password)
        user.save()

        # Clear OTP so it can't be reused
        cache.delete(_otp_cache_key(email))

        return Response({'message': 'Password has been reset successfully.'})
