from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q
from .models import Certificate
from .serializers import CertificateSerializer, CertificateUploadSerializer, CertificateReviewSerializer
from .utils import assign_faculty, get_expiring_certificates, calculate_performance
from accounts.models import CustomUser


# ───────────────────────── Student Views ─────────────────────────

class CertificateUploadView(APIView):
    """Student uploads a new certificate. Faculty is auto-assigned."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role != 'student':
            return Response({'error': 'Only students can upload certificates.'},
                            status=status.HTTP_403_FORBIDDEN)

        serializer = CertificateUploadSerializer(data=request.data)
        if serializer.is_valid():
            # Faculty rotation
            faculty = assign_faculty()
            if faculty is None:
                return Response({
                    'error': 'No faculty available currently. Please try again later.'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            cert = serializer.save(student=request.user, faculty=faculty)
            return Response({
                'message': 'Certificate uploaded successfully.',
                'certificate': CertificateSerializer(cert).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentCertificateListView(APIView):
    """Student views their own certificates."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'student':
            return Response({'error': 'Student access required.'}, status=status.HTTP_403_FORBIDDEN)

        certs = Certificate.objects.filter(student=request.user)
        serializer = CertificateSerializer(certs, many=True)
        return Response(serializer.data)


class CertificateDeleteView(APIView):
    """Student can delete their own PENDING certificate."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        if request.user.role != 'student':
            return Response({'error': 'Student access required.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            cert = Certificate.objects.get(pk=pk, student=request.user)
        except Certificate.DoesNotExist:
            return Response({'error': 'Certificate not found.'}, status=status.HTTP_404_NOT_FOUND)

        if cert.status != 'pending':
            return Response(
                {'error': 'Only pending certificates can be deleted.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cert.delete()
        return Response({'message': 'Certificate deleted successfully.'}, status=status.HTTP_200_OK)


class StudentPerformanceView(APIView):
    """Returns performance metrics for the current student."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'student':
            return Response({'error': 'Student access required.'}, status=status.HTTP_403_FORBIDDEN)

        performance = calculate_performance(request.user)
        return Response(performance)


class ExpiryAlertView(APIView):
    """Returns certificates expiring within 30 days."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'student':
            return Response({'error': 'Student access required.'}, status=status.HTTP_403_FORBIDDEN)

        expiring = get_expiring_certificates(request.user)
        serializer = CertificateSerializer(expiring, many=True)
        return Response({
            'count': expiring.count(),
            'expiring_certificates': serializer.data
        })


# ───────────────────────── Faculty Views ─────────────────────────

class FacultyAssignedView(APIView):
    """Faculty views their assigned certificates."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'faculty':
            return Response({'error': 'Faculty access required.'}, status=status.HTTP_403_FORBIDDEN)

        certs = Certificate.objects.filter(faculty=request.user)
        serializer = CertificateSerializer(certs, many=True)
        return Response(serializer.data)


class FacultyReviewView(APIView):
    """Faculty accepts or rejects a certificate with remarks."""
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, pk):
        if request.user.role != 'faculty':
            return Response({'error': 'Faculty access required.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            cert = Certificate.objects.get(pk=pk, faculty=request.user)
        except Certificate.DoesNotExist:
            return Response({'error': 'Certificate not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = CertificateReviewSerializer(data=request.data)
        if serializer.is_valid():
            cert.status = serializer.validated_data['status']
            cert.remarks = serializer.validated_data.get('remarks', '')
            cert.save()
            return Response({
                'message': f'Certificate {cert.status}.',
                'certificate': CertificateSerializer(cert).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FacultyStatsView(APIView):
    """Faculty views their review statistics."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'faculty':
            return Response({'error': 'Faculty access required.'}, status=status.HTTP_403_FORBIDDEN)

        certs = Certificate.objects.filter(faculty=request.user)
        return Response({
            'total_assigned': certs.count(),
            'pending': certs.filter(status='pending').count(),
            'accepted': certs.filter(status='accepted').count(),
            'rejected': certs.filter(status='rejected').count(),
        })


# ───────────────────────── Admin Views ─────────────────────────

class AdminAllCertificatesView(APIView):
    """Admin views all certificates in the system."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        certs = Certificate.objects.all()
        serializer = CertificateSerializer(certs, many=True)
        return Response(serializer.data)


class AdminAnalyticsView(APIView):
    """Admin views system-wide analytics."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        total_certs = Certificate.objects.count()
        certs_by_status = {
            'pending': Certificate.objects.filter(status='pending').count(),
            'accepted': Certificate.objects.filter(status='accepted').count(),
            'rejected': Certificate.objects.filter(status='rejected').count(),
        }
        total_students = CustomUser.objects.filter(role='student').count()
        total_faculty = CustomUser.objects.filter(role='faculty').count()

        # Per-faculty workload
        faculty_workload = CustomUser.objects.filter(role='faculty').annotate(
            pending_count=Count('assigned_certificates', filter=Q(assigned_certificates__status='pending')),
            total_assigned=Count('assigned_certificates'),
        ).values('id', 'username', 'first_name', 'last_name', 'pending_count', 'total_assigned')

        # Category breakdown
        from .models import Certificate as Cert
        category_data = []
        for code, label in Cert.CATEGORY_CHOICES:
            count = Certificate.objects.filter(category=code).count()
            category_data.append({'code': code, 'label': label, 'count': count})

        return Response({
            'total_certificates': total_certs,
            'certificates_by_status': certs_by_status,
            'total_students': total_students,
            'total_faculty': total_faculty,
            'faculty_workload': list(faculty_workload),
            'certificates_by_category': category_data,
        })


class TopStudentsView(APIView):
    """Admin views top 10 students ranked by performance score."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

        students = CustomUser.objects.filter(role='student')
        leaderboard = []
        for student in students:
            perf = calculate_performance(student)
            leaderboard.append({
                'id': student.id,
                'name': f"{student.first_name} {student.last_name}".strip() or student.username,
                'username': student.username,
                'email': student.email,
                'score': perf['score'],
                'accepted': perf['accepted'],
                'rejected': perf['rejected'],
                'total': perf['total'],
            })

        # Sort by score descending, then by accepted count
        leaderboard.sort(key=lambda x: (-x['score'], -x['accepted']))
        return Response(leaderboard[:10])

