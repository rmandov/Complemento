export function useGeoJson() {
  const baseURL = import.meta.env.BASE_URL
  const getGeoJson = async (url) => {
    try {
      const response = await fetch(`${baseURL}${url.replace(/^\//, '')}`)
      if (!response.ok) throw new Error(`Error ${response.status}`)

      return await response.json()
    } catch (error) {
      console.error(`Error cargando ${url}:`, error)

      return null
    }
  }
  return { getGeoJson }
}
