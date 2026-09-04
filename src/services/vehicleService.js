import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { SAMPLE_VEHICLES } from '../data/vehicles'
import { validateVehiclePayload, verifyImageMagicBytes, validateUUID } from '../utils/securityValidators'
import { sanitizeErrorMessage } from '../utils/errorHandler'
import { SECURITY_CONFIG } from '../config/securityConfig'


const ADMIN_STORAGE_KEY = 'tsm_admin_vehicles'

/* -------------------------------------------------------------------------- */
/*                         Local Storage Helpers                              */
/* -------------------------------------------------------------------------- */

function getLocalVehicles() {
  try {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY)

    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Unable to read local vehicles:', error)
  }

  return SAMPLE_VEHICLES
}

function saveLocalVehicles(vehicles) {
  try {
    localStorage.setItem(
      ADMIN_STORAGE_KEY,
      JSON.stringify(vehicles)
    )
  } catch (error) {
    console.error('Unable to save local vehicles:', error)
  }
}

/* -------------------------------------------------------------------------- */
/*                              Helpers                                       */
/* -------------------------------------------------------------------------- */

function isUUID(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  )
}

function createSlug(name = '') {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') +
    '-' +
    Date.now()
  )
}

function getErrorMessage(error) {
  if (!error) return 'Unknown error'

  return (
    error.message ||
    error.details ||
    error.hint ||
    'Unknown error'
  )
}

/* -------------------------------------------------------------------------- */
/*                           Vehicle Service                                  */
/* -------------------------------------------------------------------------- */

export const vehicleService = {

  /* ======================================================================== */
  /*                         GET ALL VEHICLES                                 */
  /* ======================================================================== */

  async getVehicles(filters = {}, sort = 'newest') {
    if (!isSupabaseConfigured) {
      let data = [...getLocalVehicles()]

      if (filters.search) {
        const q = filters.search.toLowerCase()

        data = data.filter(
          (v) =>
            (v.name || '').toLowerCase().includes(q) ||
            (v.brand || '').toLowerCase().includes(q) ||
            (v.model || '').toLowerCase().includes(q)
        )
      }

      if (filters.category) {
        data = data.filter(
          (v) => v.category === filters.category
        )
      }

      if (filters.brand) {
        data = data.filter(
          (v) => v.brand === filters.brand
        )
      }

      if (filters.fuelType) {
        data = data.filter(
          (v) =>
            v.fuelType === filters.fuelType ||
            v.fuel_type === filters.fuelType
        )
      }

      if (filters.transmission) {
        data = data.filter(
          (v) =>
            v.transmission ===
            filters.transmission
        )
      }

      if (filters.condition) {
        data = data.filter(
          (v) =>
            v.condition === filters.condition
        )
      }

      if (filters.year) {
        data = data.filter(
          (v) =>
            Number(v.year) ===
            Number(filters.year)
        )
      }

      if (filters.minPrice) {
        data = data.filter(
          (v) =>
            Number(v.price) >=
            Number(filters.minPrice)
        )
      }

      if (filters.maxPrice) {
        data = data.filter(
          (v) =>
            Number(v.price) <=
            Number(filters.maxPrice)
        )
      }

      if (filters.location) {
        data = data.filter((v) =>
          (v.location || '')
            .toLowerCase()
            .includes(
              filters.location.toLowerCase()
            )
        )
      }

      if (filters.status) {
        data = data.filter(
          (v) => v.status === filters.status
        )
      }

      switch (sort) {
        case 'price-asc':
          data.sort(
            (a, b) =>
              Number(a.price) -
              Number(b.price)
          )
          break

        case 'price-desc':
          data.sort(
            (a, b) =>
              Number(b.price) -
              Number(a.price)
          )
          break

        case 'km-asc':
          data.sort(
            (a, b) =>
              Number(
                a.kmDriven ??
                a.km_driven ??
                0
              ) -
              Number(
                b.kmDriven ??
                b.km_driven ??
                0
              )
          )
          break

        default:
          data.sort(
            (a, b) =>
              Number(b.year || 0) -
              Number(a.year || 0)
          )
      }

      return {
        data,
        error: null,
      }
    }

    try {
      let query = supabase
        .from('vehicles')
        .select(`
          *,
          vehicle_images (
            id,
            image_url,
            storage_path,
            is_primary
          )
        `)

      if (filters.search) {
        const search = filters.search
          .replace(/,/g, '')
          .trim()

        if (search) {
          query = query.or(
            `name.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`
          )
        }
      }

      if (filters.category) {
        query = query.eq(
          'category',
          filters.category
        )
      }

      if (filters.brand) {
        query = query.eq(
          'brand',
          filters.brand
        )
      }

      if (filters.fuelType) {
        query = query.eq(
          'fuel_type',
          filters.fuelType
        )
      }

      if (filters.transmission) {
        query = query.eq(
          'transmission',
          filters.transmission
        )
      }

      if (filters.condition) {
        query = query.eq(
          'condition',
          filters.condition
        )
      }

      if (filters.year) {
        query = query.eq(
          'year',
          Number(filters.year)
        )
      }

      if (filters.minPrice) {
        query = query.gte(
          'price',
          Number(filters.minPrice)
        )
      }

      if (filters.maxPrice) {
        query = query.lte(
          'price',
          Number(filters.maxPrice)
        )
      }

      if (filters.location) {
        query = query.ilike(
          'location',
          `%${filters.location}%`
        )
      }

      if (filters.status) {
        query = query.eq(
          'status',
          filters.status
        )
      }

      switch (sort) {
        case 'price-asc':
          query = query.order(
            'price',
            { ascending: true }
          )
          break

        case 'price-desc':
          query = query.order(
            'price',
            { ascending: false }
          )
          break

        case 'km-asc':
          query = query.order(
            'km_driven',
            { ascending: true }
          )
          break

        default:
          query = query.order(
            'created_at',
            { ascending: false }
          )
      }

      const {
        data,
        error,
      } = await query

      if (error) {
        throw error
      }

      const normalized =
        (data || []).map((vehicle) => ({
          ...vehicle,

          slug:
            vehicle.slug ||
            vehicle.id,

          kmDriven:
            vehicle.km_driven ??
            vehicle.kmDriven ??
            0,

          fuelType:
            vehicle.fuel_type ??
            vehicle.fuelType ??
            '',

          registrationYear:
            vehicle.registration_year ??
            vehicle.registrationYear ??
            '',

          insuranceStatus:
            vehicle.insurance_status ??
            vehicle.insuranceStatus ??
            '',

          images:
            vehicle.vehicle_images?.length
              ? vehicle.vehicle_images.map(
                (image) =>
                  image.image_url
              )
              : vehicle.images || [],
        }))

      return {
        data: normalized,
        error: null,
      }
    } catch (error) {
      console.warn(
        'Supabase vehicle query failed:',
        error
      )

      return {
        data: getLocalVehicles(),
        error,
      }
    }
  },

  /* ======================================================================== */
  /*                         GET VEHICLE                                      */
  /* ======================================================================== */

  async getVehicleById(idOrSlug) {
    if (
      !idOrSlug ||
      idOrSlug === 'undefined'
    ) {
      return {
        data: null,
        error: new Error(
          'Vehicle not found'
        ),
      }
    }

    const uuid = isUUID(idOrSlug)

    if (!isSupabaseConfigured) {
      const all = getLocalVehicles()

      const found = all.find(
        (vehicle) =>
          vehicle.id === idOrSlug ||
          vehicle.slug === idOrSlug
      )

      return {
        data: found || null,
        error: found
          ? null
          : new Error(
            'Vehicle not found'
          ),
      }
    }

    try {
      let data = null

      if (uuid) {
        const {
          data: vehicle,
          error,
        } = await supabase
          .from('vehicles')
          .select(`
            *,
            vehicle_images (
              id,
              image_url,
              storage_path,
              is_primary
            )
          `)
          .eq('id', idOrSlug)
          .maybeSingle()

        if (error) {
          throw error
        }

        data = vehicle
      } else {
        const cleanName = idOrSlug
          .replace(/-/g, ' ')
          .replace(/\b\d{4}\b/, '')
          .trim()

        if (cleanName) {
          const {
            data: vehicles,
            error,
          } = await supabase
            .from('vehicles')
            .select(`
              *,
              vehicle_images (
                id,
                image_url,
                storage_path,
                is_primary
              )
            `)
            .ilike(
              'name',
              `%${cleanName}%`
            )
            .limit(1)

          if (error) {
            throw error
          }

          data = vehicles?.[0] || null
        }
      }

      if (!data) {
        const local =
          getLocalVehicles().find(
            (vehicle) =>
              vehicle.id === idOrSlug ||
              vehicle.slug === idOrSlug
          )

        if (local) {
          return {
            data: {
              ...local,
              slug:
                local.slug ||
                local.id,
            },
            error: null,
          }
        }
      }

      if (!data) {
        return {
          data: null,
          error: new Error(
            'Vehicle not found'
          ),
        }
      }

      return {
        data: {
          ...data,

          slug:
            data.slug ||
            data.id,

          kmDriven:
            data.km_driven ??
            data.kmDriven ??
            0,

          fuelType:
            data.fuel_type ??
            data.fuelType ??
            '',

          registrationYear:
            data.registration_year ??
            data.registrationYear ??
            '',

          insuranceStatus:
            data.insurance_status ??
            data.insuranceStatus ??
            '',

          images:
            data.vehicle_images?.length
              ? data.vehicle_images.map(
                (image) =>
                  image.image_url
              )
              : data.images || [],
        },

        error: null,
      }
    } catch (error) {
      console.error(
        'Vehicle detail error:',
        error
      )

      return {
        data: null,
        error,
      }
    }
  },

  /* ======================================================================== */
  /*                         ADD VEHICLE                                      */
  /* ======================================================================== */

  async addVehicle(
    vehicleData,
    imageFiles = []
  ) {
    /* ---------------------------------------------------------------------- */
    /*                           Local Mode                                   */
    /* ---------------------------------------------------------------------- */

    if (!isSupabaseConfigured) {
      const all =
        getLocalVehicles()

      const newVehicle = {
        ...vehicleData,

        id: `vehicle-${Date.now()}`,

        slug: createSlug(
          vehicleData.name
        ),

        createdAt:
          new Date().toISOString(),

        images:
          vehicleData.images || [],
      }

      saveLocalVehicles([
        newVehicle,
        ...all,
      ])

      return {
        data: newVehicle,
        error: null,
      }
    }

    /* ---------------------------------------------------------------------- */
    /*                       Supabase Mode                                    */
    /* ---------------------------------------------------------------------- */

    try {
      /* -------------------------------------------------------------------- */
      /*                       Validate Input                                 */
      /* -------------------------------------------------------------------- */

      const validation = validateVehiclePayload(vehicleData, false)
      if (!validation.valid) {
        return {
          data: null,
          error: new Error(validation.error || 'Invalid vehicle input.'),
        }
      }

      /* -------------------------------------------------------------------- */
      /*                       Insert Vehicle                                 */
      /* -------------------------------------------------------------------- */

      const vehiclePayload = {
        name:
          vehicleData.name.trim(),

        category:
          vehicleData.category,

        brand:
          vehicleData.brand?.trim() || null,

        model:
          vehicleData.model?.trim() || null,

        year:
          Number(vehicleData.year),

        price:
          Number(vehicleData.price),

        fuel_type:
          vehicleData.fuelType ||
          null,

        transmission:
          vehicleData.transmission ||
          'Manual',

        km_driven:
          Number(
            vehicleData.kmDriven || 0
          ),

        location:
          vehicleData.location?.trim() ||
          null,

        condition:
          vehicleData.condition ||
          'Good',

        registration_year:
          vehicleData.registrationYear
            ? Number(
              vehicleData.registrationYear
            )
            : null,

        insurance_status:
          vehicleData.insuranceStatus ||
          'Valid',

        description:
          vehicleData.description?.trim() ||
          '',

        status:
          vehicleData.status ||
          'available',

        featured:
          Boolean(
            vehicleData.featured
          ),
      }

      console.log(
        'Adding vehicle:',
        vehiclePayload
      )

      const {
        data: inserted,
        error: insertError,
      } = await supabase
        .from('vehicles')
        .insert(
          vehiclePayload
        )
        .select('*')
        .single()

      if (insertError) {
        console.error(
          'Vehicle insert failed:',
          insertError
        )

        throw insertError
      }

      if (!inserted?.id) {
        throw new Error(
          'Vehicle was created but no vehicle ID was returned.'
        )
      }

      console.log(
        'Vehicle created:',
        inserted.id
      )

      /* -------------------------------------------------------------------- */
      /*                       Prepare Images                                 */
      /* -------------------------------------------------------------------- */

      const uploadedImages = []

      /* -------------------------------------------------------------------- */
      /*                  Upload Actual File Images                            */
      /* -------------------------------------------------------------------- */

      if (
        Array.isArray(imageFiles) &&
        imageFiles.length > 0
      ) {
        for (
          let index = 0;
          index < imageFiles.length;
          index++
        ) {
          const file =
            imageFiles[index]

          if (!(file instanceof File)) {
            continue
          }

          console.log(
            `Uploading image ${index + 1}/${imageFiles.length}`
          )

          const result =
            await this.uploadImage(
              file,
              inserted.id
            )

          if (result.error) {
            console.error(
              'Image upload failed:',
              result.error
            )

            /*
             * Vehicle has already been created.
             * Do not silently pretend image upload worked.
             */
            return {
              data: inserted,

              error:
                new Error(
                  `Vehicle was created, but image ${index + 1} could not be uploaded: ${getErrorMessage(
                    result.error
                  )}`
                ),

              partialSuccess: true,
            }
          }

          uploadedImages.push({
            vehicle_id:
              inserted.id,

            image_url:
              result.url,

            storage_path:
              result.path || null,

            is_primary:
              index === 0,
          })
        }
      }

      /* -------------------------------------------------------------------- */
      /*                     Insert Image URLs                                */
      /* -------------------------------------------------------------------- */

      const rawImages =
        Array.isArray(
          vehicleData.images
        )
          ? vehicleData.images
          : []

      for (
        let index = 0;
        index < rawImages.length;
        index++
      ) {
        const url =
          rawImages[index]

        if (
          typeof url !== 'string' ||
          !url.trim()
        ) {
          continue
        }

        uploadedImages.push({
          vehicle_id:
            inserted.id,

          image_url:
            url.trim(),

          storage_path:
            null,

          is_primary:
            uploadedImages.length === 0,
        })
      }

      /* -------------------------------------------------------------------- */
      /*                   Save Image Records                                 */
      /* -------------------------------------------------------------------- */

      if (
        uploadedImages.length > 0
      ) {
        const {
          error: imageDbError,
        } = await supabase
          .from('vehicle_images')
          .insert(
            uploadedImages
          )

        if (imageDbError) {
          console.error(
            'Vehicle image DB insert failed:',
            imageDbError
          )

          return {
            data: inserted,

            error:
              new Error(
                `Vehicle was created, but image records could not be saved: ${getErrorMessage(
                  imageDbError
                )}`
              ),

            partialSuccess: true,
          }
        }
      }

      /* -------------------------------------------------------------------- */
      /*                           Return                                     */
      /* -------------------------------------------------------------------- */

      return {
        data: {
          ...inserted,

          images:
            uploadedImages.map(
              (image) =>
                image.image_url
            ),
        },

        error: null,
      }
    } catch (error) {
      console.error(
        'addVehicle error:',
        error
      )

      return {
        data: null,
        error: new Error(
          sanitizeErrorMessage(error, 'Failed to save vehicle. Please check the details and try again.')
        ),
      }
    }
  },

  /* ======================================================================== */
  /*                         UPDATE VEHICLE                                   */
  /* ======================================================================== */

  async updateVehicle(
    id,
    updates
  ) {
    if (!isSupabaseConfigured) {
      const all =
        getLocalVehicles()

      const updated =
        all.map((vehicle) =>
          vehicle.id === id
            ? {
              ...vehicle,
              ...updates,
            }
            : vehicle
        )

      saveLocalVehicles(updated)

      return {
        data:
          updated.find(
            (v) => v.id === id
          ) || null,

        error: null,
      }
    }

    try {
      if (!validateUUID(id).valid) {
        throw new Error(
          'Invalid vehicle ID format.'
        )
      }

      const valCheck = validateVehiclePayload(updates, true)
      if (!valCheck.valid) {
        throw new Error(valCheck.error || 'Invalid vehicle update payload.')
      }

      const dbUpdates = {}

      if (
        updates.name !== undefined
      ) {
        dbUpdates.name =
          updates.name
      }

      if (
        updates.category !==
        undefined
      ) {
        dbUpdates.category =
          updates.category
      }

      if (
        updates.brand !== undefined
      ) {
        dbUpdates.brand =
          updates.brand
      }

      if (
        updates.model !== undefined
      ) {
        dbUpdates.model =
          updates.model
      }

      if (
        updates.year !== undefined &&
        updates.year !== ''
      ) {
        dbUpdates.year =
          Number(updates.year)
      }

      if (
        updates.price !== undefined &&
        updates.price !== ''
      ) {
        dbUpdates.price =
          Number(updates.price)
      }

      if (
        updates.fuelType !==
        undefined
      ) {
        dbUpdates.fuel_type =
          updates.fuelType
      }

      if (
        updates.transmission !==
        undefined
      ) {
        dbUpdates.transmission =
          updates.transmission
      }

      if (
        updates.kmDriven !==
        undefined &&
        updates.kmDriven !== ''
      ) {
        dbUpdates.km_driven =
          Number(
            updates.kmDriven
          )
      }

      if (
        updates.location !==
        undefined
      ) {
        dbUpdates.location =
          updates.location
      }

      if (
        updates.condition !==
        undefined
      ) {
        dbUpdates.condition =
          updates.condition
      }

      if (
        updates.registrationYear !==
        undefined &&
        updates.registrationYear !==
        ''
      ) {
        dbUpdates.registration_year =
          Number(
            updates.registrationYear
          )
      }

      if (
        updates.insuranceStatus !==
        undefined
      ) {
        dbUpdates.insurance_status =
          updates.insuranceStatus
      }

      if (
        updates.status !== undefined
      ) {
        dbUpdates.status =
          updates.status
      }

      if (
        updates.featured !==
        undefined
      ) {
        dbUpdates.featured =
          Boolean(
            updates.featured
          )
      }

      if (
        updates.description !==
        undefined
      ) {
        dbUpdates.description =
          updates.description
      }

      dbUpdates.updated_at =
        new Date().toISOString()

      const {
        data,
        error,
      } = await supabase
        .from('vehicles')
        .update(dbUpdates)
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        throw error
      }

      /* -------------------------------------------------------------------- */
      /*                  Replace Existing Images                             */
      /* -------------------------------------------------------------------- */

      if (
        Array.isArray(updates.images)
      ) {
        const {
          error: deleteError,
        } = await supabase
          .from('vehicle_images')
          .delete()
          .eq(
            'vehicle_id',
            id
          )

        if (deleteError) {
          throw deleteError
        }

        const imageRows =
          updates.images
            .filter(
              (url) =>
                typeof url ===
                'string' &&
                url.trim()
            )
            .map(
              (url, index) => ({
                vehicle_id: id,

                image_url:
                  url.trim(),

                storage_path:
                  null,

                is_primary:
                  index === 0,
              })
            )

        if (
          imageRows.length > 0
        ) {
          const {
            error:
            imageError,
          } = await supabase
            .from(
              'vehicle_images'
            )
            .insert(
              imageRows
            )

          if (imageError) {
            throw imageError
          }
        }
      }

      return {
        data,
        error: null,
      }
    } catch (error) {
      console.error(
        'updateVehicle error:',
        error
      )

      return {
        data: null,
        error: new Error(
          sanitizeErrorMessage(error, 'Failed to update vehicle. Please try again.')
        ),
      }
    }
  },

  /* ======================================================================== */
  /*                         DELETE VEHICLE                                   */
  /* ======================================================================== */

  async deleteVehicle(id) {
    if (!isSupabaseConfigured) {
      const all =
        getLocalVehicles()

      saveLocalVehicles(
        all.filter(
          (vehicle) =>
            vehicle.id !== id
        )
      )

      return {
        success: true,
        error: null,
      }
    }

    try {
      if (!validateUUID(id).valid) {
        throw new Error('Invalid vehicle ID format.')
      }

      const {
        error,
      } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      return {
        success: true,
        error: null,
      }
    } catch (error) {
      console.error(
        'deleteVehicle error:',
        error
      )

      return {
        success: false,
        error: new Error(
          sanitizeErrorMessage(error, 'Failed to delete vehicle. Please try again.')
        ),
      }
    }
  },

  /* ======================================================================== */
  /*                         UPLOAD IMAGE                                     */
  /* ======================================================================== */

  async uploadImage(
    file,
    vehicleId
  ) {
    if (!isSupabaseConfigured) {
      return {
        url: '',
        path: '',
        error: new Error(
          'Supabase is not configured.'
        ),
      }
    }

    if (!(file instanceof File)) {
      return {
        url: '',
        path: '',
        error: new Error(
          'Invalid image file.'
        ),
      }
    }

    // Binary magic byte & size header check
    const magicCheck = await verifyImageMagicBytes(file)
    if (!magicCheck.valid) {
      return {
        url: '',
        path: '',
        error: new Error(magicCheck.error || 'Invalid or untrusted image file.'),
      }
    }

    try {
      // Whitelist extension from binary magic bytes check (jpg/png/webp)
      const safeExtension = magicCheck.extension || 'jpg'

      // Path traversal prevention: enforce valid UUID folder or fallback to 'temp'
      const folder = (vehicleId && validateUUID(vehicleId).valid) ? vehicleId : 'temp'

      const uniqueToken = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`

      const fileName = `${folder}/${uniqueToken}.${safeExtension}`

      console.log(
        'Uploading to storage:',
        fileName
      )

      const {
        data,
        error,
      } = await supabase.storage
        .from('vehicle-images')
        .upload(
          fileName,
          file,
          {
            cacheControl: '3600',
            upsert: false,
            contentType:
              file.type,
          }
        )

      if (error) {
        console.error(
          'Storage upload error:',
          error
        )

        throw error
      }

      const {
        data: publicData,
      } =
        supabase.storage
          .from(
            'vehicle-images'
          )
          .getPublicUrl(
            data.path
          )

      if (
        !publicData?.publicUrl
      ) {
        throw new Error(
          'Unable to generate public image URL.'
        )
      }

      return {
        url:
          publicData.publicUrl,

        path:
          data.path,

        error: null,
      }
    } catch (error) {
      console.error(
        'uploadImage error:',
        error
      )

      return {
        url: '',
        path: '',
        error: new Error(
          sanitizeErrorMessage(error, 'Image upload failed. Please try again.')
        ),
      }
    }
  },

  /* ======================================================================== */
  /*                    REALTIME SUBSCRIPTION                                 */
  /* ======================================================================== */

  subscribeToChanges(
    callback
  ) {
    if (
      !isSupabaseConfigured
    ) {
      return () => { }
    }

    const channel =
      supabase
        .channel(
          'public:vehicles'
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'vehicles',
          },
          (payload) => {
            if (
              typeof callback ===
              'function'
            ) {
              callback(payload)
            }
          }
        )
        .subscribe()

    return () => {
      supabase.removeChannel(
        channel
      )
    }
  },
}

export default vehicleService