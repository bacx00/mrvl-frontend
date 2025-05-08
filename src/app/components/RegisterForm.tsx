'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterForm () {
  const router = useRouter()
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' })
  const [error, setError] = useState('')

  function change (k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [k]: e.target.value })
  }

  async function submit (e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Passwords do not match'); return
    }
    // hit the existing /api/auth/register route
    const r = await fetch('/api/auth/register', {
      method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(form)
    })
    if (!r.ok) { setError('Registration failed'); return }
    router.push('/user/login')
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <p className="text-danger">{error}</p>}
      {['name','email','password','confirm'].map((k,i)=>(
        <input key={i} required type={k.includes('password')?'password':'text'}
          className="form-control"
          placeholder={k[0].toUpperCase()+k.slice(1)}
          value={(form as any)[k]} onChange={change(k as any)} />
      ))}
      <button className="btn btn-primary w-100">Register</button>
    </form>
  )
}
