import Swal from 'sweetalert2';

export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'rounded-xl shadow-lg font-sans border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100'
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export const showSuccessToast = (message: string) => {
  Toast.fire({
    icon: 'success',
    title: message
  });
};

export const showErrorToast = (message: string) => {
  Toast.fire({
    icon: 'error',
    title: message
  });
};

export const showConfirmModal = async (title: string, text: string, confirmButtonText: string = 'Ya, Lanjutkan') => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#696cff', // Sneat primary
    cancelButtonColor: '#8592a3',
    confirmButtonText,
    cancelButtonText: 'Batal',
    customClass: {
      popup: 'rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-6'
    }
  });

  return result.isConfirmed;
};
