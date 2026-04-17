const API_URL = '/api';
const APP_NAME = 'IT Reference System';

// status rendering fix
function getStatusText(status){
  return status === 'resolved' ? 'تم الحل' : 'قيد المعالجة';
}
