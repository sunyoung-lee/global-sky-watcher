import './Toast.css'

export default function Toast({ message }) {
  return (
    <div className="toast">
      <span className="toast-icon">⚠</span>
      {message}
    </div>
  )
}
