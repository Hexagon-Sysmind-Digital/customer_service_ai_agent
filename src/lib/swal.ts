import Swal from 'sweetalert2';

export const CustomSwal = Swal.mixin({
  customClass: {
    popup: 'glass-card',
    confirmButton: 'btn-primary',
    cancelButton: 'btn-secondary',
    title: 'swal-title',
    htmlContainer: 'swal-text'
  },
  buttonsStyling: false,
  background: 'var(--modal-bg)',
  color: 'var(--foreground)',
});

export const showToast = (icon: 'success' | 'error' | 'warning' | 'info', title: string) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: 'var(--modal-bg)',
    color: 'var(--foreground)',
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  Toast.fire({
    icon,
    title
  });
};

export const showAlert = (icon: 'success' | 'error' | 'warning' | 'info', title: string, text?: string) => {
  return CustomSwal.fire({
    icon,
    title,
    text,
  });
};

export const showConfirm = (title: string, text: string, confirmButtonText = 'Yes', cancelButtonText = 'No') => {
  return CustomSwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true
  });
};
