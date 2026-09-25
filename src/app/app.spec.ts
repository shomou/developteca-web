import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // App declara Navbar, que usa RouterLink (necesita el router) y AuthService
      // (necesita HttpClient). Sin ambos, el componente no se puede instanciar.
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
  });

  it('se crea el componente raíz', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza el navbar y el router-outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    expect(html).toContain('Developteca');
  });
});
