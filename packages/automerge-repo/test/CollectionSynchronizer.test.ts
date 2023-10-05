import assert from "assert"
import { describe, it, beforeEach } from "vitest"
import { PeerId, Repo } from "../src/index.js"
import { CollectionSynchronizer } from "../src/synchronizer/CollectionSynchronizer.js"

describe("CollectionSynchronizer", () => {
  let repo: Repo
  let synchronizer: CollectionSynchronizer

  beforeEach(() => {
    repo = new Repo({
      network: [],
    })
    synchronizer = new CollectionSynchronizer(repo)
  })

  it("is not null", async () => {
    assert(synchronizer !== null)
  })

  it("starts synchronizing a document to peers when added", () =>
    new Promise<void>(done => {
      const handle = repo.create()
      synchronizer.addPeer("peer1" as PeerId)

      synchronizer.once("message", event => {
        assert(event.targetId === "peer1")
        assert(event.documentId === handle.documentId)
        done()
      })

      synchronizer.addDocument(handle.documentId)
    }))

  it("starts synchronizing existing documents when a peer is added", () =>
    new Promise<void>(done => {
      const handle = repo.create()
      synchronizer.addDocument(handle.documentId)
      synchronizer.once("message", event => {
        assert(event.targetId === "peer1")
        assert(event.documentId === handle.documentId)
        done()
      })
      synchronizer.addPeer("peer1" as PeerId)
    }))

  it("should not synchronize to a peer which is excluded from the share policy", () =>
    new Promise<void>((done, reject) => {
      const handle = repo.create()

      repo.sharePolicy = async (peerId: PeerId) => peerId !== "peer1"

      synchronizer.addDocument(handle.documentId)
      synchronizer.once("message", () => {
        reject(new Error("Should not have sent a message"))
      })
      synchronizer.addPeer("peer1" as PeerId)

      setTimeout(done)
    }))

  it("should not synchronize a document which is excluded from the share policy", () =>
    new Promise<void>((done, reject) => {
      const handle = repo.create()
      repo.sharePolicy = async (_, documentId) =>
        documentId !== handle.documentId

      synchronizer.addPeer("peer2" as PeerId)

      synchronizer.once("message", () => {
        reject(new Error("Should not have sent a message"))
      })

      synchronizer.addDocument(handle.documentId)

      setTimeout(done)
    }))
})
