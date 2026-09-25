import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let router: Router;
  let auth: AuthService;

  const ejecutar = () =>
    TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => localStorage.clear());

  it('bloquea a quien no tiene sesión', () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(false);
    vi.spyOn(auth, 'isAdmin').mockReturnValue(false);

    expect(ejecutar()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  // Tener sesión no basta: el área de administración exige rol admin.
  it('bloquea a un usuario autenticado que NO es admin', () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(auth, 'isAdmin').mockReturnValue(false);

    expect(ejecutar()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('deja pasar a un admin autenticado', () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(auth, 'isAdmin').mockReturnValue(true);

    expect(ejecutar()).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  // Caso defensivo: un token caducado o borrado deja currentUser con rol admin
  // pero sin token. No debe bastar con el rol.
  it('bloquea si dice ser admin pero no está autenticado', () => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(false);
    vi.spyOn(auth, 'isAdmin').mockReturnValue(true);

    expect(ejecutar()).toBe(false);
  });
});
