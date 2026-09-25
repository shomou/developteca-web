import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CommentItem } from './comment-item';
import { AuthService } from '../../../core/services/auth.service';
import { Comment, CommentStatus } from '../../../core/models/comment.model';
import { Role, User } from '../../../core/models/user.model';

describe('CommentItem', () => {
  let componente: CommentItem;
  let auth: AuthService;

  const usuario = (id: number, role: Role = 'USER'): User => ({
    id, email: `u${id}@x.c`, firstName: 'N', lastName: 'A',
    role, status: 'ACTIVE', createdAt: '2026-01-01', emailVerified: true,
  });

  const comentario = (over: Partial<Comment> = {}): Comment => ({
    id: 1,
    content: 'texto',
    author: { id: 10, firstName: 'Ada', lastName: 'Lovelace' },
    authorName: null,
    createdAt: '2026-01-01T10:00:00',
    status: 'APPROVED' as CommentStatus,
    replies: [],
    ...over,
  });

  const anonimo = (over: Partial<Comment> = {}) =>
    comentario({ author: null, authorName: 'María', ...over });

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CommentItem],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(CommentItem);
    componente = fixture.componentInstance;
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => localStorage.clear());

  const sesion = (u: User | null, admin = false) => {
    vi.spyOn(auth, 'currentUser').mockReturnValue(u);
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(u !== null);
    vi.spyOn(auth, 'isAdmin').mockReturnValue(admin);
  };

  describe('nombre mostrado', () => {
    it('usa nombre y apellido del usuario registrado', () => {
      componente.comment = comentario();
      expect(componente.displayName()).toBe('Ada Lovelace');
    });

    it('usa authorName cuando el comentario es anónimo', () => {
      componente.comment = anonimo();
      expect(componente.displayName()).toBe('María');
    });

    it('cae en "Anónimo" si no hay ni autor ni nombre', () => {
      componente.comment = comentario({ author: null, authorName: null });
      expect(componente.displayName()).toBe('Anónimo');
    });
  });

  describe('clasificación', () => {
    it('detecta los anónimos', () => {
      componente.comment = anonimo();
      expect(componente.isAnonymous()).toBe(true);

      componente.comment = comentario();
      expect(componente.isAnonymous()).toBe(false);
    });

    it('detecta los pendientes de revisión', () => {
      componente.comment = anonimo({ status: 'PENDING' });
      expect(componente.isPending()).toBe(true);

      componente.comment = anonimo({ status: 'APPROVED' });
      expect(componente.isPending()).toBe(false);
    });
  });

  describe('permiso para eliminar', () => {
    it('sin sesión, nadie puede', () => {
      sesion(null);
      componente.comment = comentario();
      expect(componente.canDelete()).toBe(false);
    });

    it('el autor puede borrar el suyo', () => {
      sesion(usuario(10));
      componente.comment = comentario();
      expect(componente.canDelete()).toBe(true);
    });

    it('otro usuario no puede', () => {
      sesion(usuario(11));
      componente.comment = comentario();
      expect(componente.canDelete()).toBe(false);
    });

    it('un admin puede borrar el de cualquiera', () => {
      sesion(usuario(99, 'ADMIN'), true);
      componente.comment = comentario();
      expect(componente.canDelete()).toBe(true);
    });

    // Regresión: canDelete comparaba user.id === comment.author.id sin comprobar
    // nulos. Con un comentario anónimo lanzaba TypeError y rompía el render.
    it('un comentario anónimo no revienta la comprobación', () => {
      sesion(usuario(10));
      componente.comment = anonimo();
      expect(() => componente.canDelete()).not.toThrow();
      expect(componente.canDelete()).toBe(false);
    });

    it('nadie puede reclamar la propiedad de un anónimo, salvo un admin', () => {
      sesion(usuario(99, 'ADMIN'), true);
      componente.comment = anonimo();
      expect(componente.canDelete()).toBe(true);
    });
  });

  describe('eventos de moderación', () => {
    // Con tres estados el destino ya no se deduce del actual: desde PENDING se
    // puede ir tanto a APPROVED como a REJECTED, así que la acción viaja explícita.
    it('aprobar emite el estado APPROVED', () => {
      componente.comment = anonimo({ status: 'PENDING' });
      const emitido: unknown[] = [];
      componente.moderateRequested.subscribe(e => emitido.push(e));

      componente.approve();

      expect(emitido).toEqual([{ comment: componente.comment, status: 'APPROVED' }]);
    });

    it('rechazar emite el estado REJECTED', () => {
      componente.comment = anonimo({ status: 'PENDING' });
      const emitido: unknown[] = [];
      componente.moderateRequested.subscribe(e => emitido.push(e));

      componente.reject();

      expect(emitido).toEqual([{ comment: componente.comment, status: 'REJECTED' }]);
    });

    it('desde APPROVED, rechazar sigue emitiendo REJECTED', () => {
      componente.comment = comentario({ status: 'APPROVED' });
      const emitido: { status: string }[] = [];
      componente.moderateRequested.subscribe(e => emitido.push(e));

      componente.reject();

      expect(emitido[0].status).toBe('REJECTED');
    });
  });
});
