export class ActiveChat {
  static readonly storageIdentifier = 'activeChat'
  static getValue(): string | null {
    return sessionStorage.getItem(this.storageIdentifier)
  }

  static setValue(username: string) {
    sessionStorage.setItem(this.storageIdentifier, username)
  }
}
