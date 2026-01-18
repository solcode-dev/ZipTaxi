import auth from '@react-native-firebase/auth';
import {FirebaseAuthError} from '../types/auth';

export class FirebaseAuthService {
  /**
   * Login with email and password
   */
  static async loginWithEmail(
    email: string,
    password: string,
  ): Promise<void> {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Create a custom token for Kakao OAuth
   */
  static async signInWithCustomToken(token: string): Promise<void> {
    try {
      await auth().signInWithCustomToken(token);
    } catch (error: any) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Logout
   */
  static async logout(): Promise<void> {
    try {
      await auth().signOut();
    } catch (error: any) {
      throw this.handleFirebaseError(error);
    }
  }

  /**
   * Get current user
   */
  static getCurrentUser() {
    return auth().currentUser;
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChanged(callback: (user: any) => void) {
    return auth().onAuthStateChanged(callback);
  }

  /**
   * Handle Firebase errors and return user-friendly error codes
   */
  private static handleFirebaseError(error: any): FirebaseAuthError {
    const code = error.code || 'auth/unknown';
    const message = error.message || 'An unknown error occurred';
    return {code, message};
  }
}
