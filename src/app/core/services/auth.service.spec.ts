import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Role, User } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const usuario = (role: Role): User => ({
    id: 1, email: 'a@b.c', firstName: 'A', lastName: 'B',
    role, status: 'ACTIVE', createdAt: '2026-01-01', emailVerified: true,
  });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  const login = (role: Role = 'USER') => {
    service.login({ email: 'a@b.c', password: 'x' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({
      success: true,
      data: { token: 'tok123', refresToken: 'r', user: usuario(role), tokenType: 'Bearer' },
    });
  };

  describe('login', () => {
    it('guarda token y usuario tras un login correcto', () => {
      login();
      expect(service.getToken()).toBe('tok123');
      expect(service.currentUser()?.email).toBe('a@b.c');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('NO guarda nada si la respuesta indica fallo', () => {
      service.login({ email: 'a@b.c', password: 'mala' }).subscribe();
      http.expectOne(`${environment.apiUrl}/auth/login`)
          .flush({ success: false, message: 'Credenciales inválidas', data: null });

      expect(service.getToken()).toBeNull();
      expect(service.currentUser()).toBeNull();
    });
  });

  describe('roles', () => {
    it('USER no es admin', () => {
      login('USER');
      expect(service.isAdmin()).toBe(false);
    });

    it('ADMIN sí lo es', () => {
      login('ADMIN');
      expect(service.isAdmin()).toBe(true);
    });

    it('SUPER_ADMIN también', () => {
      login('SUPER_ADMIN');
      expect(service.isAdmin()).toBe(true);
    });

    it('sin sesión no es admin', () => {
      expect(service.isAdmin()).toBe(false);
    });
  });

  describe('logout', () => {
    it('borra token y usuario', () => {
      login('ADMIN');
      service.logout();

      expect(service.getToken()).toBeNull();
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.isAdmin()).toBe(false);
    });
  });

  describe('persistencia', () => {
    // El rol se lee de localStorage al construir el servicio, no del servidor en
    // cada carga: por eso una pestaña abierta desde antes conserva el rol anterior
    // hasta que se vuelve a iniciar sesión.
    it('restaura la sesión de localStorage al instanciarse', () => {
      login('ADMIN');

      const nuevo = new AuthService(TestBed.inject(HttpTestingController) as never);
      expect(nuevo.currentUser()?.role).toBe('ADMIN');
    });
  });
});
