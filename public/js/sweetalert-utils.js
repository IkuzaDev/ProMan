function showToast(title, icon = 'success') {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });

  Toast.fire({
    icon: icon,
    title: title
  });
}

function showConfirm(title, text, confirmCallback) {
  Swal.fire({
    title: title,
    text: text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: '#d1d5db',
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed && typeof confirmCallback === 'function') {
      confirmCallback();
    }
  });
}

function showSuccess(title, text = '') {
  return Swal.fire({
    icon: 'success',
    title: title,
    text: text,
    confirmButtonColor: '#4f46e5'
  });
}

function showError(title, text = '') {
  return Swal.fire({
    icon: 'error',
    title: title,
    text: text,
    confirmButtonColor: '#4f46e5'
  });
}

function showLoading(title = 'Please wait...') {
  Swal.fire({
    title: title,
    allowOutsideClick: false,
    showConfirmButton: false,
    willOpen: () => {
      Swal.showLoading();
    }
  });
}

function closeAlert() {
  Swal.close();
}

function showPrompt(title, inputPlaceholder, confirmCallback) {
  Swal.fire({
    title: title,
    input: 'text',
    inputPlaceholder: inputPlaceholder,
    showCancelButton: true,
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: '#d1d5db',
    confirmButtonText: 'Submit',
    cancelButtonText: 'Cancel',
    inputValidator: (value) => {
      if (!value) {
        return 'You need to enter something!';
      }
    }
  }).then((result) => {
    if (result.isConfirmed && typeof confirmCallback === 'function') {
      confirmCallback(result.value);
    }
  });
} 