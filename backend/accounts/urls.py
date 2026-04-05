from django.urls import path
from . import views

urlpatterns = [
    path('captcha/',            views.CaptchaView.as_view(),               name='captcha'),
    path('register/',           views.RegisterView.as_view(),              name='register'),
    path('login/',              views.LoginView.as_view(),                 name='login'),
    path('forgot-password/',    views.ForgotPasswordView.as_view(),        name='forgot-password'),
    path('reset-password/',     views.ResetPasswordView.as_view(),         name='reset-password'),
    path('profile/',            views.ProfileView.as_view(),               name='profile'),
    path('users/',              views.AdminUserListView.as_view(),         name='admin-users'),
    path('users/<int:pk>/',     views.AdminUserListView.as_view(),         name='admin-user-delete'),
]
