from django.urls import path
from . import views

urlpatterns = [
    # Student endpoints
    path('upload/', views.CertificateUploadView.as_view(), name='cert-upload'),
    path('my/', views.StudentCertificateListView.as_view(), name='cert-list'),
    path('performance/', views.StudentPerformanceView.as_view(), name='cert-performance'),
    path('alerts/', views.ExpiryAlertView.as_view(), name='cert-alerts'),
    path('<int:pk>/delete/', views.CertificateDeleteView.as_view(), name='cert-delete'),

    # Faculty endpoints
    path('assigned/', views.FacultyAssignedView.as_view(), name='cert-assigned'),
    path('review/<int:pk>/', views.FacultyReviewView.as_view(), name='cert-review'),
    path('faculty-stats/', views.FacultyStatsView.as_view(), name='faculty-stats'),

    # Admin endpoints
    path('all/', views.AdminAllCertificatesView.as_view(), name='admin-all-certs'),
    path('analytics/', views.AdminAnalyticsView.as_view(), name='admin-analytics'),
    path('leaderboard/', views.TopStudentsView.as_view(), name='top-students'),
]
